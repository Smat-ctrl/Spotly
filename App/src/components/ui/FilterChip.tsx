interface FilterChipProps {
  text: string;
  active?: boolean;
  onClick?: () => void;
}

export default function FilterChip({
  text,
  active = false,
  onClick,
}: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2 rounded-3xl border transition border-black
        ${
          active
            ? "bg-black text-white border-black shadow"
            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
        }
      `}
    >
      {text}
    </button>
  );
}
