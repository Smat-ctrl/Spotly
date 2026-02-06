import Card from "../../../components/ui/Card";
import RatingPill from "../../../components/ui/RatingPill";

interface PlaceCardProps {
  title: string;
  location: string;
  category: string;
  rating: number;
  imageUrl?: string;
}

export default function PlaceCard({
  title,
  location,
  category,
  rating,
  imageUrl,
}: PlaceCardProps) {
  return (
    <Card className="w-full !p-0 overflow-hidden rounded-3xl bg-white shadow-sm transition hover:shadow-md">
      <div className="relative h-80">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <RatingPill rating={rating} className="absolute top-4 right-4" />
      </div>

      <div className="px-2 pt-4 pb-3 text-left">
        <p className="text-pink-600 font-semibold text-xs uppercase tracking-[0.25em] mb-2">
          {category}
        </p>
        <h2 className="text-xl font-semibold text-black">{title}</h2>
        <p className="mt-2 text-sm text-gray-400">{location}</p>
      </div>
    </Card>
  );
}
