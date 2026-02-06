import type { Place } from "../types";
import PlaceCard from "./PlaceCard";

interface PlacesGridProps {
  places: Place[];
}

export default function PlacesGrid({ places }: PlacesGridProps) {
  return (
    <div className="grid gap-10 md:gap-12 lg:gap-16 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {places.map((place) => (
        <PlaceCard
          key={place.title}
          title={place.title}
          location={place.location}
          category={place.category}
          rating={place.rating}
          imageUrl={place.imageUrl}
        />
      ))}
    </div>
  );
}
