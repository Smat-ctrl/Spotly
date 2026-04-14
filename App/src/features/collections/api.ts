import { AuthStorage } from "../../userData/AuthStorage";
import type { Place } from "../discover/types";
import type { Collection, SavedPlace } from "./types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function buildAuthHeaders() {
  const token = AuthStorage.getToken();

  if (!token) {
    throw new Error("You need to sign in to manage collections.");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}

export async function fetchCollections() {
  const response = await fetch(`${API_BASE}/collections`, {
    headers: buildAuthHeaders(),
  });

  const data = await readJson<{
    ok?: boolean;
    error?: string;
    collections?: Collection[];
  }>(response);

  if (!response.ok) {
    throw new Error(data.error || "Could not load collections.");
  }

  return data.collections || [];
}

export async function createCollection(name: string) {
  const response = await fetch(`${API_BASE}/collections`, {
    method: "POST",
    headers: buildAuthHeaders(),
    body: JSON.stringify({ name }),
  });

  const data = await readJson<{
    ok?: boolean;
    error?: string;
    collection?: Collection;
  }>(response);

  if (!response.ok) {
    throw new Error(data.error || "Could not create collection.");
  }

  if (!data.collection) {
    throw new Error("Collection was created, but no collection was returned.");
  }

  return data.collection;
}

export async function deleteCollection(collectionId: number) {
  const response = await fetch(`${API_BASE}/collections/${collectionId}`, {
    method: "DELETE",
    headers: buildAuthHeaders(),
  });

  const data = await readJson<{
    ok?: boolean;
    error?: string;
    deleted?: Collection;
  }>(response);

  if (!response.ok) {
    throw new Error(data.error || "Could not delete collection.");
  }

  return data.deleted;
}

export async function fetchSavedPlaces(collectionId: number) {
  const response = await fetch(
    `${API_BASE}/collections/${collectionId}/saved-places`,
    {
      headers: buildAuthHeaders(),
    },
  );

  const data = await readJson<{
    ok?: boolean;
    error?: string;
    savedPlaces?: SavedPlace[];
  }>(response);

  if (!response.ok) {
    throw new Error(data.error || "Could not load saved places.");
  }

  return data.savedPlaces || [];
}

export async function savePlaceToCollection(collectionId: number, place: Place) {
  const safeRating =
    typeof place.rating === "number" && Number.isFinite(place.rating)
      ? place.rating
      : null;
  const safeLatitude =
    typeof place.latitude === "number" && Number.isFinite(place.latitude)
      ? place.latitude
      : null;
  const safeLongitude =
    typeof place.longitude === "number" && Number.isFinite(place.longitude)
      ? place.longitude
      : null;

  const response = await fetch(
    `${API_BASE}/collections/${collectionId}/saved-places`,
    {
      method: "POST",
      headers: buildAuthHeaders(),
      body: JSON.stringify({
        name: place.title,
        category: place.category,
        address: place.location,
        latitude: safeLatitude,
        longitude: safeLongitude,
        providerPlaceId: place.providerPlaceId,
        imageUrl: place.imageUrl,
        rating: safeRating,
        notes: place.description,
      }),
    },
  );

  const data = await readJson<{
    ok?: boolean;
    error?: string;
    savedPlace?: SavedPlace;
  }>(response);

  if (!response.ok) {
    throw new Error(data.error || "Could not save this spot.");
  }

  return data.savedPlace;
}

export async function deleteSavedPlace(savedPlaceId: number) {
  const response = await fetch(`${API_BASE}/saved-places/${savedPlaceId}`, {
    method: "DELETE",
    headers: buildAuthHeaders(),
  });

  const data = await readJson<{
    ok?: boolean;
    error?: string;
    deleted?: SavedPlace;
  }>(response);

  if (!response.ok) {
    throw new Error(data.error || "Could not remove this saved spot.");
  }

  return data.deleted;
}
