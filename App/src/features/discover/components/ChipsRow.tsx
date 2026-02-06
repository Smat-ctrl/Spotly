import FilterChip from "../../../components/ui/FilterChip";
interface ChipsRowProps {
  options: string[];
  active: string;
  onChange: (option: string) => void;
}

export default function ChipsRow({ options, active, onChange }: ChipsRowProps) {
  return (
    <div className="p-6 flex gap-3">
      {options.map((opt) => (
        <FilterChip
          text={opt}
          active={opt === active}
          onClick={() => onChange(opt)}
        />
      ))}
    </div>
  );
}
