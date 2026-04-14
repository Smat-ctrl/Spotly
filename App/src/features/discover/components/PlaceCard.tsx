import Card from "../../../components/ui/Card";
import RatingPill from "../../../components/ui/RatingPill";

interface PlaceCardProps {
  title: string;
  location: string;
  category: string;
  rating: number;
  imageUrl?: string;
  onClick: () => void;
}

export default function PlaceCard({
  title,
  location,
  category,
  rating,
  imageUrl,
  onClick,
}: PlaceCardProps) {
  return (
    <Card
      className={
        "group w-full cursor-pointer overflow-hidden rounded-[28px] border border-[#111827]/8 bg-white !p-0 shadow-[0_20px_60px_rgba(15,23,42,0.07)] transition duration-200 hover:-translate-y-1.5 hover:shadow-[0_24px_70px_rgba(15,23,42,0.12)]"
      }
      onClick={onClick}
    >
      <div className="relative border-b border-[#111827]/6 bg-[linear-gradient(160deg,#fff8f6_0%,#f7fafc_58%,#eef6ff_100%)] p-3">
        <div className="absolute right-5 top-5 z-10">
          <RatingPill rating={rating} />
        </div>

        <div className="relative aspect-[4/3] overflow-hidden rounded-[22px] bg-[#f3f4f6] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
          {imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt={title}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl opacity-30"
                aria-hidden="true"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-white/16 via-transparent to-black/8" />
              <div className="relative flex h-full w-full items-center justify-center p-3">
                <img
                  src={imageUrl}
                  alt={title}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="max-h-full w-full rounded-[18px] object-contain [image-rendering:auto]"
                />
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/35 via-black/5 to-transparent" />
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-100 text-sm text-gray-400">
              No image available
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4 px-4 pb-4 pt-4 text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-pink-600">
              {category}
            </p>
            <h2 className="line-clamp-2 text-lg font-semibold leading-tight text-[#111827]">
              {title}
            </h2>
          </div>
          <div className="shrink-0 rounded-2xl bg-[#111827]/5 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.2em] text-[#111827]/55">
            Spot
          </div>
        </div>

        <div className="rounded-2xl border border-[#111827]/6 bg-[#f8fafc] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">
            Location
          </p>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-600">
            {location}
          </p>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <p>Tap to preview</p>
          <p className="font-medium text-[#111827] transition group-hover:text-pink-600">
            Open
          </p>
        </div>
      </div>
    </Card>
  );
}
