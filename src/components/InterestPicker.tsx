import { CATEGORIES, toggleInterest } from "@/lib/categories";
import { Chip } from "@/components/CategoryChips";

export function InterestPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const all = value.length === CATEGORIES.length;
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <Chip key={c} active={value.includes(c)} onClick={() => onChange(toggleInterest(value, c))}>
            {c}
          </Chip>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{value.length} selected · at least one</span>
        <button type="button" className="font-semibold text-primary" onClick={() => onChange(all ? [value[0]] : [...CATEGORIES])}>
          {all ? "Clear" : "Select all"}
        </button>
      </div>
    </div>
  );
}
