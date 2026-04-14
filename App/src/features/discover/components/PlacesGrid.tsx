import type { Place } from "../types";
import PlaceCard from "./PlaceCard";

interface PlacesGridProps {
  places: Place[];
  onPlaceClick: (place: Place) => void;
}

export default function PlacesGrid({ places, onPlaceClick }: PlacesGridProps) {
  return (
    <div
      className={
        "grid gap-6 md:gap-7 lg:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      }
    >
      {places.map((place) => (
        <PlaceCard
          key={place.title}
          title={place.title}
          location={place.location}
          category={place.category}
          rating={place.rating}
          imageUrl={place.imageUrl}
          onClick={() => onPlaceClick(place)}
        />
      ))}
    </div>
  );
}
