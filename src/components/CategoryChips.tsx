import { cn } from "@/lib/utils";

export function Chip({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 rounded-full px-4 py-2 text-sm font-bold brut-sm press",
        active ? "bg-ink text-background" : "bg-card text-foreground",
      )}
    >
      {children}
    </button>
  );
}

const STICKER_COLORS = ["bg-yellow", "bg-lime", "bg-pink"] as const;

export function CategoryTag({ category }: { category: string }) {
  const color = STICKER_COLORS[category.length % STICKER_COLORS.length];
  return (
    <span className={cn("tilt-l inline-flex shrink-0 items-center rounded-md px-2.5 py-1 font-display text-xs font-extrabold uppercase brut-sm", color)}>
      {category}
    </span>
  );
}

export function Sticker({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("tilt-r inline-flex items-center rounded-md bg-card px-2.5 py-1 text-xs font-bold brut-sm", className)}>
      {children}
    </span>
  );
}
