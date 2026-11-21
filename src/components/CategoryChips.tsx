import { cn } from "@/lib/utils";

export function Chip({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 rounded-full px-4 py-2 text-[14px] font-medium press",
        active ? "bg-foreground text-background" : "border border-border bg-white/[0.04] text-foreground/80",
      )}
    >
      {children}
    </button>
  );
}

export function CategoryTag({ category }: { category: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-white/[0.05] px-2.5 py-1 text-[12px] font-medium text-foreground/85">
      <span className="size-1.5 rounded-full bg-chrome shadow-none" />
      {category}
    </span>
  );
}

export function Sticker({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border border-border bg-white/[0.05] px-2.5 py-1 text-[12px] font-medium text-foreground/85", className)}>
      {children}
    </span>
  );
}
