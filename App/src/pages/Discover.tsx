import { useMemo, useState } from "react";
import MainLayout from "../components/layout/MainLayout";

import PlacesGrid from "../features/discover/components/PlacesGrid";
import ChipsRow from "../features/discover/components/ChipsRow";
import SearchBar from "../features/discover/components/SearchBar";

import type { Place } from "../features/discover/types";

export default function Discover() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Spots");

  const categories = [
    "All Spots",
    "Coffee",
    "Restaurants",
    "Parks",
    "Galleries",
    "Cocktails",
  ];

  const places: Place[] = [
    {
      title: "The Glass House",
      location: "West Village, NYC",
      category: "Coffee",
      rating: 4.8,
      imageUrl: "https://picsum.photos/id/1018/400/600",
    },
    {
      title: "Oak & Iron",
      location: "Brooklyn, NYC",
      category: "Cocktails",
      rating: 4.9,
      imageUrl: "https://picsum.photos/id/1025/400/600",
    },
    {
      title: "Skyline Park",
      location: "Queens, NYC",
      category: "Parks",
      rating: 4.5,
      imageUrl: "https://picsum.photos/id/1011/400/600",
    },
    {
      title: "Neon Records",
      location: "Lower East Side, NYC",
      category: "Lifestyle",
      rating: 4.7,
      imageUrl: "https://picsum.photos/id/1040/400/600",
    },
    {
      title: "Miso Ramen",
      location: "Midtown, NYC",
      category: "Restaurants",
      rating: 4.6,
      imageUrl: "https://picsum.photos/id/1060/400/600",
    },
    {
      title: "The Reading Room",
      location: "Upper West Side, NYC",
      category: "Galleries",
      rating: 4.8,
      imageUrl: "https://picsum.photos/id/1039/400/600",
    },
  ];

  
  const filteredPlaces = useMemo(() => {
    const q = query.trim().toLowerCase();

    return places.filter((p) => {
      const matchesCategory =
        activeCategory === "All Spots" || p.category === activeCategory;
      const matchesQuery =
        q.length === 0 ||
        p.title.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [places, query, activeCategory]);
  const resultsText =
  filteredPlaces.length === 0
    ? "No places match your search."
    : `Showing ${filteredPlaces.length} place${filteredPlaces.length === 1 ? "" : "s"}`;

  return (
    <MainLayout>
      <div className="mx-auto max-w-6xl px-10 py-10">
        {/* Header + Search */}
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xl">
            <h1 className="text-4xl font-arial text-black">
              Discover your city.
            </h1>
            <p className="mt-3 text-sm text-gray-500">
              Spotly helps you find, save, and remember the places <br></br>that
              make your city feel like home.
            </p>
          </div>

          <div className="w-full md:max-w-md">
            <SearchBar query={query} onQueryChange={setQuery} />
          </div>
        </div>

        {/* Chips */}
        <div className="mt-6">
          <ChipsRow
            options={categories}
            active={activeCategory}
            onChange={setActiveCategory}
          />
          <p className="mx-4">{resultsText}</p>
        </div>

        {/* Grid */}
        <div className="mt-8">
          <PlacesGrid places={filteredPlaces} />
        </div>
      </div>
    </MainLayout>
  );
}
