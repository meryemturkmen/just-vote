import { cn } from "@/lib/utils";

/** Stored colors keep their old keys; they map onto the new palette. */
const BG: Record<string, string> = { yellow: "bg-chrome", pink: "bg-pink", lime: "bg-lime", card: "bg-card" };

export function AvatarSticker({ emoji, color, size = "md", className }: { emoji: string; color: string; size?: "sm" | "md" | "lg"; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full brut-sm",
        BG[color] ?? "bg-chrome",
        size === "sm" && "size-9 text-lg",
        size === "md" && "size-12 text-2xl",
        size === "lg" && "size-20 text-4xl",
        className,
      )}
    >
      {emoji}
    </span>
  );
}
