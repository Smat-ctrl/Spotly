import { pool } from "../db";

type SerpApiResponse = {
  local_map?: {
    gps_coordinates?: {
      latitude?: number;
      longitude?: number;
    };
  };
  local_results?: unknown[];
  [key: string]: unknown;
};

type CachedRow = {
  data: SerpApiResponse;
  fetched_at: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
};

type Coordinates = {
  latitude: number;
  longitude: number;
};

const CACHE_TTL_DAYS = 30;
const NEARBY_CACHE_RADIUS_KM = 75;
const SERP_API_URL = "https://serpapi.com/search.json";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

function buildCacheKey(query: string, location: string, limit: number) {
  return `${query.trim().toLowerCase()}::${location.trim().toLowerCase()}::${limit}`;
}

function isExpired(fetchedAt: string) {
  const fetchedTime = new Date(fetchedAt).getTime();
  const now = Date.now();
  const diffDays = (now - fetchedTime) / (1000 * 60 * 60 * 24);
  return diffDays >= CACHE_TTL_DAYS;
}

function getLocalResultsCount(data: SerpApiResponse) {
  return Array.isArray(data.local_results) ? data.local_results.length : 0;
}

function trimLocalResults(
  data: SerpApiResponse,
  limit: number,
): SerpApiResponse {
  if (!Array.isArray(data.local_results)) {
    return data;
  }

  return {
    ...data,
    local_results: data.local_results.slice(0, limit),
  };
}

function extractCoordinates(data: SerpApiResponse): Coordinates | null {
  const latitude = Number(data.local_map?.gps_coordinates?.latitude);
  const longitude = Number(data.local_map?.gps_coordinates?.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return {
    latitude,
    longitude,
  };
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function distanceInKm(a: Coordinates, b: Coordinates) {
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(b.latitude - a.latitude);
  const deltaLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(haversine));
}

async function getCachedResult(cacheKey: string): Promise<CachedRow | null> {
  const result = await pool.query(
    `SELECT data, fetched_at, location, latitude, longitude
     FROM cached_places
     WHERE cache_key = $1`,
    [cacheKey],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

async function getLatestExactCachedResult(
  query: string,
  location: string,
): Promise<CachedRow | null> {
  const result = await pool.query(
    `SELECT data, fetched_at, location, latitude, longitude
     FROM cached_places
     WHERE LOWER(TRIM(query)) = LOWER(TRIM($1))
       AND LOWER(TRIM(location)) = LOWER(TRIM($2))
     ORDER BY fetched_at DESC
     LIMIT 1`,
    [query, location],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

async function getCachedResultsForQuery(query: string): Promise<CachedRow[]> {
  const result = await pool.query(
    `SELECT data, fetched_at, location, latitude, longitude
     FROM cached_places
     WHERE LOWER(TRIM(query)) = LOWER(TRIM($1))
     ORDER BY fetched_at DESC`,
    [query],
  );

  return result.rows;
}

async function getLocationCoordinates(
  location: string,
): Promise<Coordinates | null> {
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("q", location);
  url.searchParams.set("limit", "1");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Spotly/1.0",
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as Array<{
    lat?: string;
    lon?: string;
  }>;

  const first = data[0];
  const latitude = Number(first?.lat);
  const longitude = Number(first?.lon);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return {
    latitude,
    longitude,
  };
}

async function findNearbyCachedResult(
  query: string,
  location: string,
  limit: number,
): Promise<CachedRow | null> {
  const exactMatch = await getLatestExactCachedResult(query, location);

  if (
    exactMatch &&
    !isExpired(exactMatch.fetched_at) &&
    getLocalResultsCount(exactMatch.data) >= limit
  ) {
    return exactMatch;
  }

  const requestCoordinates = await getLocationCoordinates(location);
  if (!requestCoordinates) {
    return exactMatch;
  }

  const rows = await getCachedResultsForQuery(query);
  let bestMatch: { row: CachedRow; distanceKm: number } | null = null;

  for (const row of rows) {
    if (isExpired(row.fetched_at) || getLocalResultsCount(row.data) < limit) {
      continue;
    }

    if (!Number.isFinite(row.latitude) || !Number.isFinite(row.longitude)) {
      continue;
    }

    const rowCoordinates = {
      latitude: row.latitude as number,
      longitude: row.longitude as number,
    };
    const distanceKm = distanceInKm(requestCoordinates, rowCoordinates);

    if (distanceKm > NEARBY_CACHE_RADIUS_KM) {
      continue;
    }

    if (!bestMatch || distanceKm < bestMatch.distanceKm) {
      bestMatch = { row, distanceKm };
    }
  }

  return bestMatch?.row || exactMatch;
}

async function saveCachedResult(
  cacheKey: string,
  query: string,
  location: string,
  data: SerpApiResponse,
) {
  const coordinates = extractCoordinates(data);

  await pool.query(
    `INSERT INTO cached_places (
      cache_key,
      query,
      location,
      data,
      latitude,
      longitude,
      fetched_at
    )
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     ON CONFLICT (cache_key)
     DO UPDATE SET
       data = EXCLUDED.data,
       latitude = EXCLUDED.latitude,
       longitude = EXCLUDED.longitude,
       fetched_at = NOW()`,
    [
      cacheKey,
      query,
      location,
      JSON.stringify(data),
      coordinates?.latitude ?? null,
      coordinates?.longitude ?? null,
    ],
  );
}

async function ensureCacheTable() {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS cached_places (
      cache_key TEXT PRIMARY KEY,
      query TEXT NOT NULL,
      location TEXT NOT NULL,
      data JSONB NOT NULL,
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
  );

  await pool.query(
    `ALTER TABLE cached_places
     ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
     ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION`,
  );
}

async function clearMonthlyCacheIfNeeded() {
  const result = await pool.query(
    `SELECT EXISTS (
       SELECT 1
       FROM cached_places
       WHERE fetched_at <= NOW() - INTERVAL '30 days'
     ) AS should_clear`,
  );

  if (!result.rows[0]?.should_clear) {
    return;
  }

  await pool.query("TRUNCATE TABLE cached_places");
}

async function prepareCache() {
  await ensureCacheTable();
  await clearMonthlyCacheIfNeeded();
}

async function fetchFromSerpApi(
  query: string,
  location: string,
  limit: number,
): Promise<SerpApiResponse> {
  const apiKey = process.env.SERP_API_KEY;
  if (!apiKey) {
    throw new Error("SERP_API_KEY is not configured");
  }

  const url = new URL(SERP_API_URL);
  url.searchParams.set("engine", "google_local");
  url.searchParams.set("q", query);
  url.searchParams.set("location", location);
  url.searchParams.set("google_domain", "google.com");
  url.searchParams.set("hl", "en");
  url.searchParams.set("gl", "ca");
  url.searchParams.set("num", String(limit));
  url.searchParams.set("api_key", apiKey);

  const response = await fetch(url);
  const json = (await response.json()) as SerpApiResponse & { error?: string };

  if (!response.ok) {
    throw new Error(
      json.error || `SerpApi request failed with status ${response.status}`,
    );
  }

  if (json.error) {
    throw new Error(json.error);
  }

  return json;
}

export async function getCachedLocalPlaces(
  query: string,
  location: string,
  limit = 40,
) {
  await prepareCache();

  const normalizedQuery = query.trim();
  const normalizedLocation = location.trim();
  const safeLimit = Math.max(1, Math.min(limit, 60));
  const cacheKey = buildCacheKey(normalizedQuery, normalizedLocation, safeLimit);

  const cached = await getCachedResult(cacheKey);
  if (cached && !isExpired(cached.fetched_at)) {
    return trimLocalResults(cached.data, safeLimit);
  }

  const nearbyCached = await findNearbyCachedResult(
    normalizedQuery,
    normalizedLocation,
    safeLimit,
  );

  if (!nearbyCached) {
    return null;
  }

  return trimLocalResults(nearbyCached.data, safeLimit);
}

export async function getLocalPlaces(
  query: string,
  location: string,
  limit = 40,
) {
  await prepareCache();

  const normalizedQuery = query.trim();
  const normalizedLocation = location.trim();
  const safeLimit = Math.max(1, Math.min(limit, 60));
  const cacheKey = buildCacheKey(normalizedQuery, normalizedLocation, safeLimit);

  const cached = await getCachedResult(cacheKey);
  if (cached && !isExpired(cached.fetched_at)) {
    return trimLocalResults(cached.data, safeLimit);
  }

  const nearbyCached = await findNearbyCachedResult(
    normalizedQuery,
    normalizedLocation,
    safeLimit,
  );

  if (nearbyCached) {
    return trimLocalResults(nearbyCached.data, safeLimit);
  }

  const freshData = await fetchFromSerpApi(
    normalizedQuery,
    normalizedLocation,
    safeLimit,
  );

  await saveCachedResult(
    cacheKey,
    normalizedQuery,
    normalizedLocation,
    freshData,
  );

  return trimLocalResults(freshData, safeLimit);
}
