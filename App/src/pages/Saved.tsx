import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import Card from "../components/ui/Card";
import {
  createCollection,
  deleteCollection,
  fetchCollections,
} from "../features/collections/api";
import type { Collection } from "../features/collections/types";
import { AuthStorage } from "../userData/AuthStorage";

export default function Saved() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newCollectionName, setNewCollectionName] = useState("");
  const [createError, setCreateError] = useState("");
  const [createBusy, setCreateBusy] = useState(false);
  const [deleteBusyId, setDeleteBusyId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCollections() {
      try {
        setLoading(true);
        setError("");
        const nextCollections = await fetchCollections();

        if (!cancelled) {
          setCollections(nextCollections);
        }
      } catch (err: any) {
        if (!cancelled) {
          setCollections([]);
          setError(
            err instanceof Error ? err.message : "Could not load collections.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCollections();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreateCollection(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmedName = newCollectionName.trim();
    if (!trimmedName) {
      setCreateError("Enter a collection name.");
      return;
    }

    try {
      setCreateBusy(true);
      setCreateError("");
      const createdCollection = await createCollection(trimmedName);
      setCollections((current) =>
        [createdCollection, ...current].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      );
      setNewCollectionName("");
    } catch (err: any) {
      setCreateError(
        err instanceof Error ? err.message : "Could not create collection.",
      );
    } finally {
      setCreateBusy(false);
    }
  }

  async function handleDeleteCollection(collection: Collection) {
    try {
      setDeleteBusyId(collection.id);
      setError("");
      await deleteCollection(collection.id);
      setCollections((current) =>
        current.filter((item) => item.id !== collection.id),
      );
    } catch (err: any) {
      setError(
        err instanceof Error ? err.message : "Could not delete collection.",
      );
    } finally {
      setDeleteBusyId(null);
    }
  }

  if (!AuthStorage.isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  return (
    <MainLayout disableVerticalScroll>
      <div className="mx-auto w-full max-w-[1280px] overflow-x-hidden px-6 py-8 sm:px-8 lg:px-10">
        <div className="max-w-xl">
          <h1 className="text-4xl font-arial text-black">My Collections</h1>
          <p className="mt-3 text-sm text-gray-500">
            Your saved spot collections, powered by live data.
          </p>
        </div>

        <form
          onSubmit={handleCreateCollection}
          className="mt-8 max-w-2xl rounded-[28px] border border-[#111827]/8 bg-white p-5 shadow-sm"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-400">
            Add Collection
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder="Weekend Cafes"
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#FF2056]"
            />
            <button
              type="submit"
              disabled={createBusy}
              className="rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {createBusy ? "Creating..." : "Create"}
            </button>
          </div>

          {createError && (
            <p className="mt-3 text-sm text-red-600">{createError}</p>
          )}
        </form>

        {loading && <p className="mt-8 text-sm text-gray-500">Loading collections...</p>}

        {error && (
          <p className="mt-8 max-w-xl rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {!loading && !error && collections.length === 0 && (
          <div className="mt-8 max-w-xl rounded-[28px] border border-[#111827]/8 bg-[#f8fafc] p-6">
            <h2 className="text-xl font-semibold text-[#111827]">
              No collections yet
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Save a spot from Discover and it will show up here.
            </p>
          </div>
        )}

        {!loading && !error && collections.length > 0 && (
          <div className="mt-8 grid min-w-0 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection) => (
              <Card
                key={collection.id}
                className="flex h-[300px] min-w-0 flex-col rounded-3xl border border-gray-100 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-[56px] w-[56px] items-center justify-center rounded-2xl bg-[#FF2056]/8 text-lg font-semibold text-[#FF2056]">
                    {collection.name.charAt(0).toUpperCase()}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteCollection(collection)}
                    disabled={deleteBusyId === collection.id}
                    className="rounded-2xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deleteBusyId === collection.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
                <div className="mt-10 min-w-0">
                  <p className="break-words font-arial text-2xl font-semibold">
                    {collection.name}
                  </p>
                </div>
                <div className="mt-auto pt-10">
                  <Link
                    to={`/collection-page/${collection.id}`}
                    className="font-arial text-sm font-bold"
                  >
                    Open Collection &gt;
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
