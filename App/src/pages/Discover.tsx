import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import { apiUrl } from "../config/api";

import PlacesGrid from "../features/discover/components/PlacesGrid";
import ChipsRow from "../features/discover/components/ChipsRow";
import SearchBar from "../features/discover/components/SearchBar";
import InfoPanel from "../features/discover/components/InfoPanel";
import type { Place } from "../features/discover/types";
import {
  fetchCollections,
  fetchSavedPlaces,
  savePlaceToCollection,
} from "../features/collections/api";
import type { Collection, SavedPlace } from "../features/collections/types";
import { AuthStorage } from "../userData/AuthStorage";

type StoredLocation = {
  latitude?: number;
  longitude?: number;
  city?: string;
  state?: string;
  country?: string;
  label?: string;
};

type BackendPlace = {
  title?: string;
  address?: string;
  address_lines?: string[];
  rating?: number | string;
  description?: string;
  type?: string;
  types?: string[];
  thumbnail?: string;
  thumbnail_large?: string;
  image?: string;
  photo?: string;
  photos?: Array<{
    image?: string;
    thumbnail?: string;
  }>;
};

type PlacesResponse = {
  local_results?: BackendPlace[];
};

function upgradeGoogleImageUrl(url: string) {
  const trimmed = url.trim();

  if (!trimmed) {
    return trimmed;
  }

  const upgradedSizedSuffix = trimmed.replace(
    /=w\d+(-h\d+)?(-k-no)?$/i,
    "=w1600-h1200-k-no",
  );

  if (upgradedSizedSuffix !== trimmed) {
    return upgradedSizedSuffix;
  }

  const upgradedQuerySize = trimmed.replace(
    /([?&](?:w|width|sz|s)=)\d+/gi,
    "$11600",
  );

  if (upgradedQuerySize !== trimmed) {
    return upgradedQuerySize;
  }

  return trimmed;
}

function rankImageCandidate(url: string) {
  const normalized = url.toLowerCase();
  let score = 0;

  const widthMatch = normalized.match(/=w(\d+)/);
  if (widthMatch) {
    score += Number(widthMatch[1]);
  }

  if (/(thumbnail|small|avatar|logo|icon)/.test(normalized)) {
    score -= 800;
  }

  if (/(googleusercontent|gstatic|ggpht)/.test(normalized)) {
    score += 400;
  }

  if (/(image|photo|original|media)/.test(normalized)) {
    score += 200;
  }

  return score;
}

type LocationSuggestion = {
  label: string;
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  country?: string;
};

const DEFAULT_LOCATION_LABEL = "Toronto, Ontario, Canada";
const PLACE_CATEGORIES = [
  "Coffee",
  "Restaurants",
  "Parks",
  "Galleries",
  "Cocktails",
] as const;
const CATEGORIES = ["All Spots", ...PLACE_CATEGORIES];
type PlaceCategory = (typeof PLACE_CATEGORIES)[number];

function categoryToQuery(category: string) {
  switch (category) {
    case "Coffee":
      return "coffee";
    case "Restaurants":
      return "restaurants";
    case "Parks":
      return "parks";
    case "Galleries":
      return "art galleries";
    case "Cocktails":
      return "cocktail bars";
    default:
      return "popular places";
  }
}

function pickBestImage(item: BackendPlace) {
  const candidates = [
    item.photo,
    item.image,
    item.thumbnail_large,
    ...(item.photos || []).flatMap((photo) => [photo.image, photo.thumbnail]),
    item.thumbnail,
  ]
    .filter(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0,
    )
    .map(upgradeGoogleImageUrl)
    .sort((a, b) => rankImageCandidate(b) - rankImageCandidate(a));

  return candidates[0] || "https://picsum.photos/1200/900";
}

function buildLocationLabel(location: StoredLocation) {
  return (
    location.label ||
    [location.city, location.state, location.country]
      .filter(Boolean)
      .join(", ") ||
    DEFAULT_LOCATION_LABEL
  );
}

function mapBackendPlace(
  item: BackendPlace,
  category: PlaceCategory,
  locationLabel: string,
): Place {
  return {
    title: item.title || "Unknown Place",
    location: item.address || item.address_lines?.join(", ") || locationLabel,
    category,
    rating: Number(item.rating) || 0,
    description: item.description,
    imageUrl: pickBestImage(item),
  };
}

function buildPlaceHaystack(item: BackendPlace) {
  return [
    item.title,
    item.type,
    ...(item.types || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function scorePlaceCategory(haystack: string, category: PlaceCategory) {
  switch (category) {
    case "Coffee":
      return /(coffee shop|coffeehouse|cafe|espresso bar|roastery|third wave coffee)/.test(
        haystack,
      )
        ? 4
        : /\b(coffee|espresso|cafe)\b/.test(haystack)
          ? 2
          : 0;
    case "Cocktails":
      return /(cocktail bar|speakeasy|wine bar|lounge|pub|brewery|nightclub|taproom)/.test(
        haystack,
      )
        ? 4
        : /\b(cocktail|bar|pub|lounge)\b/.test(haystack)
          ? 2
          : 0;
    case "Parks":
      return /(national park|city park|botanical garden|dog park|parkette|trail|playground|conservation area|beach)/.test(
        haystack,
      )
        ? 4
        : /\b(park|trail|garden|beach)\b/.test(haystack)
          ? 2
          : 0;
    case "Galleries":
      return /(art gallery|gallery museum|museum|exhibit|exhibition|contemporary art|artist studio)/.test(
        haystack,
      )
        ? 4
        : /\b(gallery|museum|exhibit)\b/.test(haystack)
          ? 2
          : 0;
    case "Restaurants":
      return /(restaurant|diner|bistro|eatery|grill|ramen|pizza|burger|brunch|steakhouse|sushi|bbq|kitchen|trattoria|pizzeria)/.test(
        haystack,
      )
        ? 4
        : /\b(restaurant|diner|bistro|eatery)\b/.test(haystack)
          ? 2
          : 0;
  }
}

function inferPlaceCategory(item: BackendPlace): PlaceCategory | null {
  const haystack = buildPlaceHaystack(item);
  const ranking = PLACE_CATEGORIES.map((category) => ({
    category,
    score: scorePlaceCategory(haystack, category),
  })).sort((a, b) => b.score - a.score);

  if (!ranking[0] || ranking[0].score <= 0) {
    return null;
  }

  return ranking[0].category;
}

function belongsToCategory(item: BackendPlace, category: PlaceCategory) {
  const haystack = buildPlaceHaystack(item);
  const ownScore = scorePlaceCategory(haystack, category);

  if (ownScore <= 0) {
    return false;
  }

  const strongestOtherScore = PLACE_CATEGORIES.filter(
    (value) => value !== category,
  ).reduce((best, value) => Math.max(best, scorePlaceCategory(haystack, value)), 0);

  if (ownScore >= 4) {
    return ownScore >= strongestOtherScore;
  }

  return ownScore > strongestOtherScore;
}

async function fetchPlacesForCategory(
  category: PlaceCategory,
  locationLabel: string,
) {
  const categoryQuery = categoryToQuery(category);
  const cachedUrl = apiUrl(
    `/api/places/cached?q=${encodeURIComponent(categoryQuery)}&location=${encodeURIComponent(locationLabel)}&limit=40`,
  );
  const liveUrl = apiUrl(
    `/api/places?q=${encodeURIComponent(categoryQuery)}&location=${encodeURIComponent(locationLabel)}&limit=40`,
  );

  const cachedResponse = await fetch(cachedUrl);

  if (cachedResponse.ok) {
    const cachedData = (await cachedResponse.json()) as PlacesResponse;
    return {
      category,
      items: (cachedData.local_results || []) as BackendPlace[],
    };
  }

  if (cachedResponse.status !== 404) {
    throw new Error(`Failed to fetch cached ${category}`);
  }

  const liveResponse = await fetch(liveUrl);

  if (!liveResponse.ok) {
    throw new Error(`Failed to fetch ${category}`);
  }

  const liveData = (await liveResponse.json()) as PlacesResponse;
  return {
    category,
    items: (liveData.local_results || []) as BackendPlace[],
  };
}

function dedupePlaces(places: Place[]) {
  const seen = new Map<string, Place>();

  for (const place of places) {
    const key = `${place.title.toLowerCase()}::${place.location.toLowerCase()}`;
    const existing = seen.get(key);

    if (!existing) {
      seen.set(key, place);
      continue;
    }

    if ((place.rating ?? 0) > (existing.rating ?? 0)) {
      seen.set(key, place);
    }
  }

  return Array.from(seen.values());
}

function dedupeBackendPlaces(items: BackendPlace[]) {
  const seen = new Map<string, BackendPlace>();

  for (const item of items) {
    const title = item.title?.trim().toLowerCase() || "unknown-place";
    const location =
      item.address?.trim().toLowerCase() ||
      item.address_lines?.join(", ").trim().toLowerCase() ||
      "unknown-location";
    const key = `${title}::${location}`;
    const existing = seen.get(key);

    if (!existing) {
      seen.set(key, item);
      continue;
    }

    if (Number(item.rating) > Number(existing.rating)) {
      seen.set(key, item);
    }
  }

  return Array.from(seen.values());
}

function matchesSavedPlace(place: Place, savedPlace: SavedPlace) {
  const placeProvider = place.providerPlaceId?.trim().toLowerCase();
  const savedProvider = savedPlace.provider_place_id?.trim().toLowerCase();

  if (placeProvider && savedProvider) {
    return placeProvider === savedProvider;
  }

  return (
    place.title.trim().toLowerCase() === savedPlace.name.trim().toLowerCase() &&
    place.location.trim().toLowerCase() ===
      (savedPlace.address || "Saved location").trim().toLowerCase()
  );
}

async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<LocationSuggestion | null> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("zoom", "10");
  url.searchParams.set("addressdetails", "1");

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Failed to reverse geocode location");
  }

  const data = await res.json();
  const address = data.address || {};
  const city =
    address.city ||
    address.town ||
    address.village ||
    address.hamlet ||
    address.county;
  const state = address.state || address.region;
  const country = address.country;
  const label =
    [city, state, country].filter(Boolean).join(", ") ||
    data.display_name ||
    `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;

  return {
    label,
    latitude,
    longitude,
    city,
    state,
    country,
  };
}

async function searchLocations(search: string): Promise<LocationSuggestion[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("q", search);
  url.searchParams.set("limit", "6");
  url.searchParams.set("addressdetails", "1");

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Failed to search locations");
  }

  const data = (await res.json()) as Array<{
    lat: string;
    lon: string;
    display_name?: string;
    address?: Record<string, string | undefined>;
  }>;

  return data.map((item) => {
    const address = item.address || {};
    const city =
      address.city ||
      address.town ||
      address.village ||
      address.hamlet ||
      address.county;
    const state = address.state || address.region;
    const country = address.country;

    return {
      label:
        [city, state, country].filter(Boolean).join(", ") ||
        item.display_name ||
        "Unknown location",
      latitude: Number(item.lat),
      longitude: Number(item.lon),
      city,
      state,
      country,
    };
  });
}

export default function Discover() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Spots");
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [collectionsError, setCollectionsError] = useState("");
  const [savedCollectionIds, setSavedCollectionIds] = useState<number[]>([]);
  const [saveBusyCollectionId, setSaveBusyCollectionId] = useState<number | null>(
    null,
  );
  const [saveMessage, setSaveMessage] = useState("");
  const [locationData, setLocationData] = useState<StoredLocation>({
    label: DEFAULT_LOCATION_LABEL,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [locationMenuOpen, setLocationMenuOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<
    LocationSuggestion[]
  >([]);
  const [locationSearchLoading, setLocationSearchLoading] = useState(false);
  const [locationSearchError, setLocationSearchError] = useState("");
  const [locationBusy, setLocationBusy] = useState(false);
  const locationMenuRef = useRef<HTMLDivElement | null>(null);

  const locationLabel = buildLocationLabel(locationData);

  useEffect(() => {
    const saved = localStorage.getItem("spotly_location");
    if (!saved) return;

    try {
      const parsed: StoredLocation = JSON.parse(saved);
      setLocationData((current) => ({
        ...current,
        ...parsed,
        label: buildLocationLabel(parsed),
      }));
    } catch {
      console.error("Could not parse saved location");
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        locationMenuRef.current &&
        !locationMenuRef.current.contains(event.target as Node)
      ) {
        setLocationMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (
      locationData.label ||
      locationData.latitude === undefined ||
      locationData.longitude === undefined
    ) {
      return;
    }

    let cancelled = false;

    async function hydrateLocationLabel() {
      try {
        const resolved = await reverseGeocode(
          locationData.latitude as number,
          locationData.longitude as number,
        );

        if (!cancelled && resolved) {
          setLocationData(resolved);
          localStorage.setItem("spotly_location", JSON.stringify(resolved));
        }
      } catch (err) {
        console.error("Could not resolve current location", err);
      }
    }

    hydrateLocationLabel();

    return () => {
      cancelled = true;
    };
  }, [locationData]);

  useEffect(() => {
    let cancelled = false;

    async function loadPlaces() {
      try {
        setLoading(true);
        setError("");

        const categoriesToLoad =
          activeCategory === "All Spots"
            ? PLACE_CATEGORIES
            : ([activeCategory] as PlaceCategory[]);

        const results = await Promise.all(
          categoriesToLoad.map(async (category) => {
            try {
              return await fetchPlacesForCategory(category, locationLabel);
            } catch (error) {
              console.error(`Could not load ${category} places`, error);
              return {
                category,
                items: [] as BackendPlace[],
              };
            }
          }),
        );

        if (!cancelled) {
          const uniquePlaces = dedupeBackendPlaces(results.flatMap((result) => result.items));
          const mappedPlaces =
            activeCategory === "All Spots"
              ? uniquePlaces
                  .map((item) => ({
                    item,
                    inferredCategory: inferPlaceCategory(item),
                  }))
                  .filter(
                    (entry): entry is {
                      item: BackendPlace;
                      inferredCategory: PlaceCategory;
                    } => entry.inferredCategory !== null,
                  )
                  .map((entry) =>
                    mapBackendPlace(
                      entry.item,
                      entry.inferredCategory,
                      locationLabel,
                    ),
                  )
              : uniquePlaces
                  .filter((item) =>
                    belongsToCategory(item, activeCategory as PlaceCategory),
                  )
                  .map((item) =>
                    mapBackendPlace(
                      item,
                      activeCategory as PlaceCategory,
                      locationLabel,
                    ),
                  );

          setPlaces(dedupePlaces(mappedPlaces));

          if (mappedPlaces.length === 0) {
            setError("Could not load places right now.");
          }
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError("Could not load places right now.");
          setPlaces([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPlaces();

    return () => {
      cancelled = true;
    };
  }, [locationLabel, activeCategory]);

  useEffect(() => {
    if (!locationMenuOpen) return;

    const trimmed = locationSearch.trim();
    if (trimmed.length < 2) {
      setLocationSuggestions([]);
      setLocationSearchError("");
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      try {
        setLocationSearchLoading(true);
        setLocationSearchError("");
        const suggestions = await searchLocations(trimmed);

        if (!cancelled) {
          setLocationSuggestions(suggestions);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setLocationSuggestions([]);
          setLocationSearchError("Could not search locations right now.");
        }
      } finally {
        if (!cancelled) {
          setLocationSearchLoading(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [locationSearch, locationMenuOpen]);

  useEffect(() => {
    if (!collectionsOpen) {
      return;
    }

    if (!AuthStorage.isLoggedIn()) {
      setCollections([]);
      setCollectionsError("Sign in to add spots to your collections.");
      return;
    }

    let cancelled = false;

    async function loadCollections() {
      try {
        setCollectionsLoading(true);
        setCollectionsError("");
        const nextCollections = await fetchCollections();
        const collectionMemberships = selectedPlace
          ? await Promise.all(
              nextCollections.map(async (collection) => {
                const savedPlaces = await fetchSavedPlaces(collection.id);
                return {
                  collectionId: collection.id,
                  hasPlace: savedPlaces.some((savedPlace) =>
                    matchesSavedPlace(selectedPlace, savedPlace),
                  ),
                };
              }),
            )
          : [];

        if (!cancelled) {
          setCollections(nextCollections);
          setSavedCollectionIds(
            collectionMemberships
              .filter((item) => item.hasPlace)
              .map((item) => item.collectionId),
          );
        }
      } catch (err: any) {
        if (!cancelled) {
          setCollections([]);
          setSavedCollectionIds([]);
          setCollectionsError(
            err instanceof Error ? err.message : "Could not load collections.",
          );
        }
      } finally {
        if (!cancelled) {
          setCollectionsLoading(false);
        }
      }
    }

    loadCollections();

    return () => {
      cancelled = true;
    };
  }, [collectionsOpen, selectedPlace]);

  const filteredPlaces = useMemo(() => {
    const q = query.trim().toLowerCase();

    return places.filter((p) => {
      const matchesQuery =
        q.length === 0 ||
        p.title.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);

      return matchesQuery;
    });
  }, [places, query, activeCategory]);

  async function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationSearchError("Geolocation is not supported on this browser.");
      return;
    }

    setLocationBusy(true);
    setLocationSearchError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const resolved = await reverseGeocode(
            position.coords.latitude,
            position.coords.longitude,
          );

          const nextLocation =
            resolved ||
            ({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              label: `${position.coords.latitude.toFixed(3)}, ${position.coords.longitude.toFixed(3)}`,
            } satisfies StoredLocation);

          setLocationData(nextLocation);
          localStorage.setItem("spotly_location", JSON.stringify(nextLocation));
          setLocationSearch(nextLocation.label || "");
          setLocationSuggestions([]);
          setLocationMenuOpen(false);
        } catch (err) {
          console.error(err);
          setLocationSearchError("Could not resolve your current location.");
        } finally {
          setLocationBusy(false);
        }
      },
      () => {
        setLocationBusy(false);
        setLocationSearchError("Could not get your current location.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      },
    );
  }

  function applyLocation(suggestion: LocationSuggestion) {
    const nextLocation: StoredLocation = {
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
      city: suggestion.city,
      state: suggestion.state,
      country: suggestion.country,
      label: suggestion.label,
    };

    setLocationData(nextLocation);
    localStorage.setItem("spotly_location", JSON.stringify(nextLocation));
    setLocationSearch(suggestion.label);
    setLocationSuggestions([]);
    setLocationSearchError("");
    setLocationMenuOpen(false);
  }

  function openCollectionsModal() {
    setSaveMessage("");
    setSavedCollectionIds([]);
    setCollectionsOpen(true);
  }

  async function handleSaveToCollection(collection: Collection) {
    if (!selectedPlace) {
      return;
    }

    if (!AuthStorage.isLoggedIn()) {
      setCollectionsOpen(false);
      navigate("/login");
      return;
    }

    try {
      setSaveBusyCollectionId(collection.id);
      setCollectionsError("");
      await savePlaceToCollection(collection.id, selectedPlace);
      setSaveMessage(
        `Saved to ${collection.name}. You can keep adding it to other collections.`,
      );
      setSavedCollectionIds((current) =>
        current.includes(collection.id) ? current : [...current, collection.id],
      );
    } catch (err: any) {
      setCollectionsError(
        err instanceof Error ? err.message : "Could not save this spot.",
      );
    } finally {
      setSaveBusyCollectionId(null);
    }
  }

  const resultsText = loading
    ? "Loading places..."
    : error
      ? error
      : filteredPlaces.length === 0
        ? "No places match your search."
        : `Showing ${filteredPlaces.length} place${filteredPlaces.length === 1 ? "" : "s"} near ${locationLabel}`;

  return (
    <MainLayout>
      <div className="mx-auto w-full max-w-[1280px] px-6 py-8 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xl">
            <h1 className="text-4xl font-arial text-black">
              Discover your city.
            </h1>
            <p className="mt-3 text-sm text-gray-500">
              Spotly helps you find, save, and remember the places that make
              your city feel like home.
            </p>

            <div className="relative mt-3" ref={locationMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setLocationMenuOpen((open) => !open);
                  setLocationSearch(locationLabel);
                }}
                className="inline-flex items-center gap-2 rounded-2xl border border-[#FF2056]/20 bg-[#FF2056]/5 px-4 py-2 text-sm font-medium text-[#FF2056]"
              >
                <span>Current area: {locationLabel}</span>
                <span aria-hidden>{locationMenuOpen ? "^" : "v"}</span>
              </button>

              {locationMenuOpen && (
                <div className="absolute left-0 top-full z-30 mt-3 w-full min-w-[320px] rounded-3xl border border-gray-200 bg-white p-4 shadow-xl">
                  <div className="flex gap-2">
                    <input
                      value={locationSearch}
                      onChange={(e) => setLocationSearch(e.target.value)}
                      placeholder="Search a city, region, or country"
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none"
                    />
                    <button
                      type="button"
                      onClick={useCurrentLocation}
                      className="rounded-2xl bg-black px-4 py-3 text-sm font-medium text-white"
                    >
                      {locationBusy ? "Locating..." : "Use Mine"}
                    </button>
                  </div>

                  {locationSearchLoading && (
                    <p className="mt-3 text-sm text-gray-500">
                      Searching locations...
                    </p>
                  )}

                  {locationSearchError && (
                    <p className="mt-3 text-sm text-red-500">
                      {locationSearchError}
                    </p>
                  )}

                  <div className="mt-3 max-h-72 overflow-y-auto">
                    {locationSuggestions.map((suggestion) => (
                      <button
                        key={`${suggestion.label}-${suggestion.latitude}-${suggestion.longitude}`}
                        type="button"
                        onClick={() => applyLocation(suggestion)}
                        className="flex w-full items-start rounded-2xl px-3 py-3 text-left transition hover:bg-gray-50"
                      >
                        <span className="text-sm text-gray-800">
                          {suggestion.label}
                        </span>
                      </button>
                    ))}

                    {!locationSearchLoading &&
                      locationSearch.trim().length >= 2 &&
                      locationSuggestions.length === 0 &&
                      !locationSearchError && (
                        <p className="px-3 py-3 text-sm text-gray-500">
                          No matching locations found.
                        </p>
                      )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="w-full md:max-w-md">
            <SearchBar query={query} onQueryChange={setQuery} />
          </div>
        </div>

        <div className="mt-4">
          <ChipsRow
            options={[...CATEGORIES]}
            active={activeCategory}
            onChange={setActiveCategory}
          />
          <p className="mt-1 px-1">{resultsText}</p>
        </div>

        <div className="mt-6">
          <PlacesGrid places={filteredPlaces} onPlaceClick={setSelectedPlace} />
        </div>

        {selectedPlace && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
              onClick={() => setSelectedPlace(null)}
            />
            <InfoPanel
              title={selectedPlace.title}
              location={selectedPlace.location}
              category={selectedPlace.category}
              rating={selectedPlace.rating}
              imageUrl={selectedPlace.imageUrl}
              description={selectedPlace.description}
              onClose={() => setSelectedPlace(null)}
              onAction={openCollectionsModal}
              actionLabel={AuthStorage.isLoggedIn() ? "Save Spot" : "Sign In to Save"}
              actionMessage={saveMessage}
            />
          </>
        )}

        {selectedPlace && collectionsOpen && (
          <>
            <div
              className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm"
              onClick={() => setCollectionsOpen(false)}
            />
            <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
              <div className="w-full max-w-md rounded-[32px] bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.2)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-400">
                      Save Spot
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-[#111827]">
                      Choose a collection
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-gray-500">
                      Add {selectedPlace.title} to one of your existing collections.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCollectionsOpen(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-[#111827]"
                  >
                    X
                  </button>
                </div>

                {!AuthStorage.isLoggedIn() && (
                  <div className="mt-6 rounded-3xl border border-[#111827]/8 bg-[#f8fafc] p-5">
                    <p className="text-sm leading-6 text-gray-600">
                      Sign in to save spots into your collections.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate("/login")}
                      className="mt-4 rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white"
                    >
                      Go to Login
                    </button>
                  </div>
                )}

                {AuthStorage.isLoggedIn() && (
                  <div className="mt-6 space-y-3">
                    {collectionsLoading && (
                      <p className="text-sm text-gray-500">Loading collections...</p>
                    )}

                    {collectionsError && (
                      <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {collectionsError}
                      </p>
                    )}

                    {!collectionsLoading && collections.length === 0 && !collectionsError && (
                      <p className="rounded-2xl border border-[#111827]/8 bg-[#f8fafc] px-4 py-4 text-sm text-gray-600">
                        You do not have any collections yet.
                      </p>
                    )}

                    {collections.map((collection) => {
                      const alreadySaved = savedCollectionIds.includes(collection.id);

                      return (
                        <button
                          key={collection.id}
                          type="button"
                          onClick={() => handleSaveToCollection(collection)}
                          disabled={saveBusyCollectionId !== null || alreadySaved}
                          className={`flex w-full items-center justify-between rounded-3xl border border-[#111827]/8 px-4 py-4 text-left transition ${
                            alreadySaved
                              ? "cursor-not-allowed border-[#111827]/6 bg-gray-100 opacity-50 blur-[1px]"
                              : "hover:border-pink-200 hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-60"
                          }`}
                        >
                          <div>
                            <p className="text-base font-semibold text-[#111827]">
                              {collection.name}
                            </p>
                            <p className="mt-1 text-sm text-gray-500">
                              {alreadySaved
                                ? "Already in this collection"
                                : "Add this spot to the collection"}
                            </p>
                          </div>
                          <span className="text-sm font-medium text-pink-600">
                            {alreadySaved
                              ? "Added"
                              : saveBusyCollectionId === collection.id
                                ? "Saving..."
                                : "Add"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
