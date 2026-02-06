interface RatingPillProps {
  rating: number;
  className?: string;
}

export default function RatingPill({ rating, className }: RatingPillProps) {
  return (
    <div
      className={`flex items-center gap-1 px-3 py-1 rounded-full bg-white text-black text-sm font-medium shadow ${className ?? ""}`}
    >
      ⭐ {rating}
    </div>
  );
}
