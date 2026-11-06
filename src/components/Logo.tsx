import { cn } from "@/lib/utils";

/** "Just Vote" sticker wordmark */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center font-display text-xl font-extrabold uppercase leading-none tracking-tight", className)} aria-label="Just Vote">
      <span className="tilt-l inline-block rounded-md bg-ink px-2 py-1 text-background">Just</span>
      <span className="tilt-r -ml-1 inline-block rounded-md bg-primary px-2 py-1 brut-sm">Vote!</span>
    </span>
  );
}
