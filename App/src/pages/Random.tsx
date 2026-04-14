import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import { apiUrl } from "../config/api";
import ChipsRow from "../features/discover/components/ChipsRow";
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
  label?: string;
};

type CachedPlace = {
  title?: string;
  address?: string;
  address_lines?: string[];
  rating?: number | string;
  thumbnail?: string;
  image?: string;
  photo?: string;
  photos?: Array<{
    image?: string;
    thumbnail?: string;
  }>;
};

const PLACE_CATEGORIES = [
  "Coffee",
  "Restaurants",
  "Parks",
  "Galleries",
  "Cocktails",
] as const;

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

function pickBestImage(item: CachedPlace) {
  return (
    item.photo ||
    item.image ||
    item.photos?.[0]?.image ||
    item.photos?.[0]?.thumbnail ||
    item.thumbnail ||
    ""
  );
}

function pickRandomItem<T>(items: T[]) {
  if (items.length === 0) {
    return null;
  }

  return items[Math.floor(Math.random() * items.length)] || null;
}

function toPlace(
  item: CachedPlace,
  category: string,
  locationLabel: string,
): Place {
  return {
    title: item.title || "Unknown place",
    location: item.address || item.address_lines?.join(", ") || locationLabel,
    category,
    rating: Number(item.rating) || 0,
    imageUrl: pickBestImage(item) || undefined,
  };
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

export default function Random() {
  const [activeCategory, setActiveCategory] = useState("");
  const [display, setDisplay] = useState<CachedPlace | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [collectionsError, setCollectionsError] = useState("");
  const [savedCollectionIds, setSavedCollectionIds] = useState<number[]>([]);
  const [saveBusyCollectionId, setSaveBusyCollectionId] = useState<
    number | null
  >(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const locationLabel = useMemo(() => {
    const saved = localStorage.getItem("spotly_location");

    if (!saved) {
      return "Toronto, Ontario, Canada";
    }

    try {
      return (
        (JSON.parse(saved) as StoredLocation).label ||
        "Toronto, Ontario, Canada"
      );
    } catch {
      return "Toronto, Ontario, Canada";
    }
  }, []);

  const displayPlace = useMemo(
    () => (display ? toPlace(display, activeCategory, locationLabel) : null),
    [activeCategory, display, locationLabel],
  );

  async function randomizeAgain() {
    if (!activeCategory) {
      setDisplay(null);
      setError("");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const query = categoryToQuery(activeCategory);
      const response = await fetch(
        apiUrl(
          `/api/places/cached?q=${encodeURIComponent(query)}&location=${encodeURIComponent(locationLabel)}&limit=40`,
        ),
      );

      const text = await response.text();
      const data = text ? JSON.parse(text) : null;

      if (!response.ok) {
        setDisplay(null);
        setError(
          data?.error ||
            "No cached places found. Search this category in Discover first.",
        );
        return;
      }

      const localResults = (data?.local_results || []) as CachedPlace[];
      const randomPlace = pickRandomItem(localResults);

      if (!randomPlace) {
        setDisplay(null);
        setError(
          "No cached places found. Search this category in Discover first.",
        );
        return;
      }

      setDisplay(randomPlace);
    } catch (err) {
      console.error(err);
      setDisplay(null);
      setError("Could not load cached places right now.");
    } finally {
      setLoading(false);
    }
  }

  function handleCategoryChange(category: string) {
    setActiveCategory(category);
    setDisplay(null);
    setSelectedPlace(null);
    setError("");
  }

  async function loadCollectionsForPlace(place: Place) {
    try {
      setCollectionsLoading(true);
      setCollectionsError("");
      const nextCollections = await fetchCollections();
      const collectionMemberships = await Promise.all(
        nextCollections.map(async (collection) => {
          const savedPlaces = await fetchSavedPlaces(collection.id);
          return {
            collectionId: collection.id,
            hasPlace: savedPlaces.some((savedPlace) =>
              matchesSavedPlace(place, savedPlace),
            ),
          };
        }),
      );

      setCollections(nextCollections);
      setSavedCollectionIds(
        collectionMemberships
          .filter((item) => item.hasPlace)
          .map((item) => item.collectionId),
      );
    } catch (err: any) {
      setCollections([]);
      setSavedCollectionIds([]);
      setCollectionsError(
        err instanceof Error ? err.message : "Could not load collections.",
      );
    } finally {
      setCollectionsLoading(false);
    }
  }

  async function openCollectionsModal() {
    if (!selectedPlace) {
      return;
    }

    setSaveMessage("");
    setCollectionsOpen(true);
    await loadCollectionsForPlace(selectedPlace);
  }

  async function handleSaveToCollection(collection: Collection) {
    if (!selectedPlace) {
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

  if (!AuthStorage.isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  return (
    <MainLayout>
      <div className="flex w-full flex-col items-center px-6 py-8">
        <div className="w-full max-w-3xl ms-[224px]">
          <ChipsRow
            options={[...PLACE_CATEGORIES]}
            active={activeCategory}
            onChange={handleCategoryChange}
          />
        </div>

        <div className="mt-[100px] w-full max-w-md">
          {!display && (
            <div className="flex h-[360px] w-full items-center justify-center rounded-[32px] bg-gray-200 px-6 text-center text-sm text-gray-500">
              {!activeCategory
                ? "Choose a category to randomize from cached Discover results."
                : "Click Randomize to pick a cached place from this category."}
            </div>
          )}

          {display && (
            <button
              type="button"
              onClick={() => {
                if (displayPlace) {
                  setSelectedPlace(displayPlace);
                }
              }}
              className="w-full overflow-hidden rounded-[32px] border border-[#111827]/8 bg-white text-left shadow-[0_20px_60px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(15,23,42,0.12)]"
            >
              <div className="aspect-[4/3] bg-[#f3f4f6]">
                {pickBestImage(display) ? (
                  <img
                    src={pickBestImage(display)}
                    alt={display.title || "Random place"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                    No image available
                  </div>
                )}
              </div>

              <div className="space-y-4 p-6">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-pink-600">
                    {activeCategory}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-[#111827]">
                    {display.title || "Unknown place"}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    {display.address ||
                      display.address_lines?.join(", ") ||
                      locationLabel}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#111827]/8 bg-[#f8fafc] px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">
                    Rating
                  </p>
                  <p className="mt-2 text-base font-semibold text-[#111827]">
                    {display.rating
                      ? `${Number(display.rating).toFixed(1)} / 5`
                      : "No rating"}
                  </p>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <p>Tap to preview</p>
                  <p className="font-medium text-[#111827]">Open</p>
                </div>
              </div>
            </button>
          )}
        </div>

        {error && (
          <p className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={randomizeAgain}
          disabled={!activeCategory || loading}
          className="mt-[50px] rounded bg-[#FF2056] px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {loading ? "Randomizing... 🔄" : "Randomize 🔄"}
        </button>

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
              onClose={() => setSelectedPlace(null)}
              onAction={openCollectionsModal}
              actionLabel="Save Spot"
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
                      Add {selectedPlace.title} to one of your existing
                      collections.
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

                <div className="mt-6 space-y-3">
                  {collectionsLoading && (
                    <p className="text-sm text-gray-500">
                      Loading collections...
                    </p>
                  )}

                  {collectionsError && (
                    <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                      {collectionsError}
                    </p>
                  )}

                  {!collectionsLoading &&
                    collections.length === 0 &&
                    !collectionsError && (
                      <p className="rounded-2xl border border-[#111827]/8 bg-[#f8fafc] px-4 py-4 text-sm text-gray-600">
                        You do not have any collections yet.
                      </p>
                    )}

                  {collections.map((collection) => {
                    const alreadySaved = savedCollectionIds.includes(
                      collection.id,
                    );

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
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
