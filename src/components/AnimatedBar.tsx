import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Result row: label + percentage, with a slim bar that fills after mount. */
export function AnimatedBar({ pct, label, highlight, color = "bg-chrome" }: { pct: number; label: string; highlight?: boolean; color?: string }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = requestAnimationFrame(() => setW(pct));
    return () => cancelAnimationFrame(t);
  }, [pct]);
  return (
    <div className={cn("rounded-2xl bg-card px-4 py-3 brut-sm", highlight && "ring-iridescent")}>
      <div className="flex items-baseline justify-between text-[15px] font-semibold">
        <span>
          {label}
          {highlight && <span className="ml-1.5 font-normal text-muted-foreground">· Your pick</span>}
        </span>
        <span className="tabular-nums">{pct}%</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
        <div className={cn("h-full rounded-full shadow-none transition-[width] duration-1000 ease-[var(--ease-spring)]", color)} style={{ width: `${w}%` }} />
      </div>
    </div>
  );
}
