import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Result bar that fills from 0 to pct after mount. */
export function AnimatedBar({ pct, label, highlight, color = "bg-primary" }: { pct: number; label: string; highlight?: boolean; color?: string }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = requestAnimationFrame(() => setW(pct));
    return () => cancelAnimationFrame(t);
  }, [pct]);
  return (
    <div className="relative h-11 overflow-hidden rounded-xl bg-card brut-sm">
      <div className={cn("h-full border-r-2 transition-[width] duration-1000 ease-out", color)} style={{ width: `${w}%` }} />
      <div className="absolute inset-0 flex items-center justify-between px-3 font-display font-extrabold">
        <span>{label}{highlight && " ← you"}</span>
        <span className="text-lg">{pct}%</span>
      </div>
    </div>
  );
}
