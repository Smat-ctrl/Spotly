interface SearchBarProps {
  query: string;
  onQueryChange: (newQuery: string) => void;
}

export default function SearchBar({ query, onQueryChange }: SearchBarProps) {
  return (
    <form
      className="p-6 flex items-center gap-3"
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
        className="w-11 h-11 bg-[#FF2056] border flex items-center justify-center"
      >
        ⚲
      </button>
    </form>
  );
}
