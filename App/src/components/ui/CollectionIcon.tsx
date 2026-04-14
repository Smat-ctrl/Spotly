type Variant = "want" | "visited" | "date";

const STYLES: Record<Variant, { accent: string }> = {
  want: { accent: "#FF2056" },
  visited: { accent: "#16A34A" },
  date: { accent: "#F59E0B" },
};

export default function CollectionIcon({ variant }: { variant: Variant }) {
  const { accent } = STYLES[variant];

  return (
    <div className="h-18 w-18 flex items-center justify-center rounded-3xl bg-gray-50">
      {variant === "want" && (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path
            d="M7 3h10a1 1 0 0 1 1 1v17l-6-3-6 3V4a1 1 0 0 1 1-1z"
            stroke={accent}
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
        </svg>
      )}

      {variant === "visited" && (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path
            d="M20 6L9 17l-5-5"
            stroke={accent}
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}

      {variant === "date" && (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 7v5l3 2"
            stroke={accent}
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <path
            d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
            stroke={accent}
            strokeWidth="2.2"
          />
        </svg>
      )}
    </div>
  );
}
