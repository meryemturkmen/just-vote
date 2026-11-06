import { cn } from "@/lib/utils";

export function Chip({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition active:scale-95",
        active ? "border-primary bg-primary text-primary-foreground" : "bg-card text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function CategoryTag({ category }: { category: string }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-semibold text-accent-foreground">
      {category}
    </span>
  );
}
