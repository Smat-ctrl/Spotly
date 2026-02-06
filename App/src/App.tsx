import { useState } from "react";
import PlaceCard from "./features/discover/components/PlaceCard";
import type { Place } from "./features/discover/types";
import MainLayout from "./components/layout/MainLayout";
import Discover from "./pages/Discover";
import "./index.css";
function App() {
  return (
    // <div className="min-h-screen bg-gray-100 p-8">
    //   <div className="flex gap-8">
    //     {places.map((place) => (
    //       <PlaceCard
    //         key={place.title}
    //         title={place.title}
    //         location={place.location}
    //         category={place.category}
    //         rating={place.rating}
    //         imageUrl={place.imageUrl}
    //       />
    //     ))}
    //   </div>
    // </div>
    <Discover />
  );
}

export default App;
