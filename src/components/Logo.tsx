import { useId } from "react";
import { cn } from "@/lib/utils";

/** Polished chrome star — the brand mark. */
export function ChromeStar({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={cn("size-7 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]", className)}>
      <defs>
        <linearGradient id={`${id}m`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".22" stopColor="#9b9b9b" />
          <stop offset=".42" stopColor="#f7f7f7" />
          <stop offset=".58" stopColor="#5c5c5c" />
          <stop offset=".78" stopColor="#e6e6e6" />
          <stop offset="1" stopColor="#7d7d7d" />
        </linearGradient>
        <radialGradient id={`${id}h`} cx=".42" cy=".38" r=".45">
          <stop offset="0" stopColor="#fff" stopOpacity=".95" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path
        d="M32 4c1.6 0 2.6 1 3.3 2.6l6.2 13.4 14.6 1.7c3.4.4 4.4 3.6 1.9 5.9L47.2 37.6l3 14.5c.7 3.4-2 5.3-5 3.6L32 48.4 18.8 55.7c-3 1.7-5.7-.2-5-3.6l3-14.5L5.9 27.6c-2.5-2.3-1.5-5.5 1.9-5.9l14.6-1.7 6.2-13.4C29.4 5 30.4 4 32 4z"
        fill={`url(#${id}m)`}
        stroke="#ffffff"
        strokeOpacity=".55"
        strokeWidth="1"
      />
      <path
        d="M32 4c1.6 0 2.6 1 3.3 2.6l6.2 13.4 14.6 1.7c3.4.4 4.4 3.6 1.9 5.9L47.2 37.6l3 14.5c.7 3.4-2 5.3-5 3.6L32 48.4 18.8 55.7c-3 1.7-5.7-.2-5-3.6l3-14.5L5.9 27.6c-2.5-2.3-1.5-5.5 1.9-5.9l14.6-1.7 6.2-13.4C29.4 5 30.4 4 32 4z"
        fill={`url(#${id}h)`}
      />
    </svg>
  );
}

/** "Just Vote" wordmark */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-display text-[19px] font-semibold leading-none tracking-[-0.02em]", className)} aria-label="Just Vote">
      <ChromeStar className="size-6" />
      <span>
        Just <span className="text-chrome">Vote</span>
      </span>
    </span>
  );
}
