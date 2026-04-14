import { useEffect, useMemo, useState } from "react";
import MainLayout from "../components/layout/MainLayout";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import InfoPanel from "../features/discover/components/InfoPanel";
import type { Place } from "../features/discover/types";
import PlacesGrid from "../features/discover/components/PlacesGrid";
import {
  deleteCollection,
  deleteSavedPlace,
  fetchCollections,
  fetchSavedPlaces,
} from "../features/collections/api";
import type { Collection, SavedPlace } from "../features/collections/types";
import { AuthStorage } from "../userData/AuthStorage";

function toPlace(savedPlace: SavedPlace): Place {
  return {
    title: savedPlace.name,
    location: savedPlace.address || "Saved location",
    category: savedPlace.category || "Saved Spot",
    rating: Number(savedPlace.rating) || 0,
    imageUrl: savedPlace.image_url || undefined,
    description: savedPlace.notes || undefined,
    providerPlaceId: savedPlace.provider_place_id || undefined,
    latitude: savedPlace.latitude ?? undefined,
    longitude: savedPlace.longitude ?? undefined,
    savedPlaceId: savedPlace.id,
  };
}

export default function CollectionPage() {
  const navigate = useNavigate();
  const { collectionId } = useParams();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);
  const [deleteCollectionBusy, setDeleteCollectionBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = Number(collectionId);
    if (!Number.isFinite(id)) {
      setError("Collection not found.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadCollectionPage() {
      try {
        setLoading(true);
        setError("");

        const [nextCollections, nextSavedPlaces] = await Promise.all([
          fetchCollections(),
          fetchSavedPlaces(id),
        ]);

        if (!cancelled) {
          setCollections(nextCollections);
          setSavedPlaces(nextSavedPlaces);
        }
      } catch (err: any) {
        if (!cancelled) {
          setCollections([]);
          setSavedPlaces([]);
          setError(
            err instanceof Error
              ? err.message
              : "Could not load this collection page.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCollectionPage();

    return () => {
      cancelled = true;
    };
  }, [collectionId]);

  const collection = useMemo(
    () => collections.find((item) => item.id === Number(collectionId)),
    [collectionId, collections],
  );

  const places = useMemo(() => savedPlaces.map(toPlace), [savedPlaces]);

  function handlePlaceClick(place: Place) {
    setActionMessage("");
    setSelectedPlace(place);
  }

  async function handleRemovePlace() {
    if (!selectedPlace?.savedPlaceId) {
      setActionMessage("This saved spot could not be removed.");
      return;
    }

    try {
      setRemoveBusy(true);
      setActionMessage("");
      await deleteSavedPlace(selectedPlace.savedPlaceId);
      setSavedPlaces((current) =>
        current.filter((item) => item.id !== selectedPlace.savedPlaceId),
      );
      setSelectedPlace(null);
    } catch (err: any) {
      setActionMessage(
        err instanceof Error ? err.message : "Could not remove this saved spot.",
      );
    } finally {
      setRemoveBusy(false);
    }
  }

  async function handleDeleteCollection() {
    if (!collection) {
      return;
    }

    try {
      setDeleteCollectionBusy(true);
      setError("");
      await deleteCollection(collection.id);
      navigate("/saved", { replace: true });
    } catch (err: any) {
      setError(
        err instanceof Error ? err.message : "Could not delete this collection.",
      );
    } finally {
      setDeleteCollectionBusy(false);
    }
  }

  if (!AuthStorage.isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  return (
    <MainLayout>
      <div className="mx-auto w-full max-w-[1280px] overflow-x-hidden px-6 py-8 sm:px-8 lg:px-10">
        <Link
          to="/saved"
          className="mb-6 inline-block text-md font-semibold text-gray-500 hover:text-gray-700"
        >
          &larr; Back to Collections
        </Link>

        <div className="flex flex-wrap items-end gap-3 sm:gap-4">
          <h1 className="break-words font-arial text-3xl sm:text-5xl">
            {collection?.name || "Collection"}
          </h1>
          {!loading && !error && (
            <h3 className="pb-1 font-semibold text-gray-500">
              {places.length} Spot{places.length === 1 ? "" : "s"}
            </h3>
          )}
        </div>

        {collection && (
          <button
            type="button"
            onClick={handleDeleteCollection}
            disabled={deleteCollectionBusy}
            className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleteCollectionBusy ? "Deleting Collection..." : "Delete Collection"}
          </button>
        )}

        {loading && <p className="mt-8 text-sm text-gray-500">Loading spots...</p>}

        {error && (
          <p className="mt-8 max-w-xl rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {!loading && !error && places.length === 0 && (
          <div className="mt-8 max-w-xl rounded-[28px] border border-[#111827]/8 bg-[#f8fafc] p-6">
            <h2 className="text-xl font-semibold text-[#111827]">
              No saved spots here yet
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Add a place from Discover and it will appear in this collection.
            </p>
          </div>
        )}

        {!loading && !error && places.length > 0 && (
          <div className="mt-8 w-full min-w-0">
            <PlacesGrid places={places} onPlaceClick={handlePlaceClick} />
          </div>
        )}

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
              onAction={handleRemovePlace}
              actionDisabled={removeBusy}
              actionLabel={removeBusy ? "Removing..." : "Remove From Collection"}
              actionMessage={actionMessage}
              actionVariant="danger"
              highlightTitle="Manage This Spot"
              highlightText="Remove this place from the current collection if you no longer want it saved here."
            />
          </>
        )}
      </div>
    </MainLayout>
  );
}
