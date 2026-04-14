import { pool } from "../db";

type SerpApiResponse = {
  local_results?: unknown[];
  [key: string]: unknown;
};

type CachedRow = {
  data: SerpApiResponse;
  fetched_at: string;
};

const CACHE_TTL_HOURS = 12;
const SERP_API_URL = "https://serpapi.com/search.json";

function buildCacheKey(query: string, location: string, limit: number) {
  return `${query.trim().toLowerCase()}::${location.trim().toLowerCase()}::${limit}`;
}

function isExpired(fetchedAt: string) {
  const fetchedTime = new Date(fetchedAt).getTime();
  const now = Date.now();
  const diffHours = (now - fetchedTime) / (1000 * 60 * 60);
  return diffHours > CACHE_TTL_HOURS;
}

async function getCachedResult(
  cacheKey: string
): Promise<CachedRow | null> {
  const result = await pool.query(
    `SELECT data, fetched_at
     FROM cached_places
     WHERE cache_key = $1`,
    [cacheKey]
  );

  if (result.rows.length === 0) return null;
  return result.rows[0];
}

async function getLatestCachedResultForQuery(
  query: string,
  location: string,
): Promise<CachedRow | null> {
  const result = await pool.query(
    `SELECT data, fetched_at
     FROM cached_places
     WHERE LOWER(TRIM(query)) = LOWER(TRIM($1))
       AND LOWER(TRIM(location)) = LOWER(TRIM($2))
     ORDER BY fetched_at DESC
     LIMIT 1`,
    [query, location],
  );

  if (result.rows.length === 0) return null;
  return result.rows[0];
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

export async function getCachedLocalPlaces(
  query: string,
  location: string,
  limit = 40,
) {
  await ensureCacheTable();

  const normalizedQuery = query.trim();
  const normalizedLocation = location.trim();
  const safeLimit = Math.max(1, Math.min(limit, 60));
  const cacheKey = buildCacheKey(
    normalizedQuery,
    normalizedLocation,
    safeLimit,
  );

  const cached = await getCachedResult(cacheKey);

  if (cached && !isExpired(cached.fetched_at)) {
    return trimLocalResults(cached.data, safeLimit);
  }

  const fallbackCached = await getLatestCachedResultForQuery(
    normalizedQuery,
    normalizedLocation,
  );

  if (
    !fallbackCached ||
    isExpired(fallbackCached.fetched_at) ||
    getLocalResultsCount(fallbackCached.data) < safeLimit
  ) {
    return null;
  }

  return trimLocalResults(fallbackCached.data, safeLimit);
}

async function saveCachedResult(
  cacheKey: string,
  query: string,
  location: string,
  data: SerpApiResponse
) {
  await pool.query(
    `INSERT INTO cached_places (cache_key, query, location, data, fetched_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (cache_key)
     DO UPDATE SET
       data = EXCLUDED.data,
       fetched_at = NOW()`,
    [cacheKey, query, location, JSON.stringify(data)]
  );
}

async function ensureCacheTable() {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS cached_places (
      cache_key TEXT PRIMARY KEY,
      query TEXT NOT NULL,
      location TEXT NOT NULL,
      data JSONB NOT NULL,
      fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`
  );
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
    throw new Error(json.error || `SerpApi request failed with status ${response.status}`);
  }

  if (json.error) {
    throw new Error(json.error);
  }

  return json;
}

export async function getLocalPlaces(
  query: string,
  location: string,
  limit = 40,
) {
  await ensureCacheTable();

  const normalizedQuery = query.trim();
  const normalizedLocation = location.trim();
  const safeLimit = Math.max(1, Math.min(limit, 60));
  const cacheKey = buildCacheKey(
    normalizedQuery,
    normalizedLocation,
    safeLimit,
  );

  const cached = await getCachedResult(cacheKey);

  if (cached && !isExpired(cached.fetched_at)) {
    return trimLocalResults(cached.data, safeLimit);
  }

  const fallbackCached = await getLatestCachedResultForQuery(
    normalizedQuery,
    normalizedLocation,
  );

  if (
    fallbackCached &&
    !isExpired(fallbackCached.fetched_at) &&
    getLocalResultsCount(fallbackCached.data) >= safeLimit
  ) {
    return trimLocalResults(fallbackCached.data, safeLimit);
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
    freshData
  );

  return freshData;
}
