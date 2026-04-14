import FilterChip from "../../../components/ui/FilterChip";
interface ChipsRowProps {
  options: string[];
  active: string;
  onChange: (option: string) => void;
}

export default function ChipsRow({ options, active, onChange }: ChipsRowProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <FilterChip
          key={opt}
          text={opt}
          active={opt === active}
          onClick={() => onChange(opt)}
        />
      ))}
    </div>
  );
}
