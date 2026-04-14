interface SearchBarProps {
  query: string;
  onQueryChange: (newQuery: string) => void;
}

export default function SearchBar({ query, onQueryChange }: SearchBarProps) {
  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => e.preventDefault()}
    >
      <input
        className="w-full rounded-2xl border px-5 py-3"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search places"
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            onQueryChange("");
          }
        }}
      />
      <button
        type="submit"
        className="w-11 h-11 bg-[#FF2056] rounded-[10px] border flex items-center justify-center"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M15.75 15.75L12.495 12.495"
            stroke="black"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M8.25 14.25C11.5637 14.25 14.25 11.5637 14.25 8.25C14.25 4.93629 11.5637 2.25 8.25 2.25C4.93629 2.25 2.25 4.93629 2.25 8.25C2.25 11.5637 4.93629 14.25 8.25 14.25Z"
            stroke="black"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </form>
  );
}
