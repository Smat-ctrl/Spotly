interface InfoPanelProps {
  title: string;
  location: string;
  category: string;
  rating: number;
  imageUrl?: string;
  description?: string;
  onClose: () => void;
  onAction: () => void;
  actionDisabled?: boolean;
  actionLabel?: string;
  actionMessage?: string;
  actionVariant?: "primary" | "danger";
  highlightTitle?: string;
  highlightText?: string;
}

export default function InfoPanel({
  title,
  location,
  category,
  rating,
  imageUrl,
  description,
  onClose,
  onAction,
  actionDisabled = false,
  actionLabel = "Save Spot",
  actionMessage,
  actionVariant = "primary",
  highlightTitle = "Why Save It",
  highlightText = "Keep this place in your collections, revisit it later, and compare it with other finds across your city.",
}: InfoPanelProps) {
  const actionClassName =
    actionVariant === "danger"
      ? "mt-6 w-full rounded-2xl bg-[#dc2626] py-4 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-300"
      : "mt-6 w-full rounded-2xl bg-black py-4 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-300";

  return (
    <div className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-[560px] flex-col border-l border-[#111827]/8 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.18)]">
      <div className="relative border-b border-[#111827]/6 bg-[linear-gradient(160deg,#fff8f6_0%,#f7fafc_58%,#eef6ff_100%)] px-6 pb-6 pt-6">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-sm font-semibold text-[#111827] shadow transition hover:bg-gray-100"
        >
          X
        </button>

        <div className="mb-4 flex items-center justify-between gap-3 pr-14">
          <span className="inline-flex rounded-full bg-pink-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white">
            {category}
          </span>
          <div className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#111827] shadow-sm">
            {rating > 0 ? `${rating.toFixed(1)} / 5` : "No rating yet"}
          </div>
        </div>

        <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] bg-[#f3f4f6] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
          {imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt={title}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                className="absolute inset-0 h-full w-full scale-110 object-cover blur-3xl opacity-30"
                aria-hidden="true"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-white/18 via-transparent to-black/10" />
              <div className="relative flex h-full w-full items-center justify-center p-4">
                <img
                  src={imageUrl}
                  alt={title}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="max-h-full w-full rounded-[22px] object-contain"
                />
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-100 text-sm text-gray-400">
              No image available
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto p-6">
        <div className="mb-6">
          <h2 className="text-3xl font-semibold leading-tight text-[#111827]">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-500">{location}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-[#111827]/6 bg-[#f8fafc] px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">
              Rating
            </p>
            <p className="mt-2 text-lg font-semibold text-[#111827]">
              {rating > 0 ? `${rating.toFixed(1)} / 5` : "No rating"}
            </p>
          </div>
          <div className="rounded-2xl border border-[#111827]/6 bg-[#f8fafc] px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">
              Category
            </p>
            <p className="mt-2 text-lg font-semibold text-[#111827]">{category}</p>
          </div>
        </div>

        <div className="mt-6 rounded-[24px] border border-[#111827]/6 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-400">
            About This Spot
          </p>
          <div className="mt-3 text-sm leading-7 text-gray-600">
            {description ||
              "A fuller look at this spot, with the original image preserved so you can see the place more clearly before saving it."}
          </div>
        </div>

        <div className="mt-6 rounded-[24px] bg-[linear-gradient(135deg,#111827_0%,#1f2937_100%)] p-5 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/60">
            {highlightTitle}
          </p>
          <p className="mt-3 text-sm leading-7 text-white/85">
            {highlightText}
          </p>
        </div>

        {actionMessage && (
          <p className="mt-6 rounded-2xl border border-[#111827]/8 bg-[#f8fafc] px-4 py-3 text-sm text-gray-600">
            {actionMessage}
          </p>
        )}

        <button
          type="button"
          onClick={onAction}
          disabled={actionDisabled}
          className={actionClassName}
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
