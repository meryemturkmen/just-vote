import type { ReactNode } from "react";
import { ChromeStar } from "@/components/Logo";
import { cn } from "@/lib/utils";

/** Calm, centered message used for empty / end / error states. */
export function EmptyState({ title, children, action, icon, className }: {
  title: ReactNode; children?: ReactNode; action?: ReactNode; icon?: ReactNode; className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-3 px-6 text-center", className)}>
      <div className="mb-2">{icon ?? <ChromeStar className="size-16" />}</div>
      <h2 className="font-display text-[26px] font-bold leading-tight tracking-[-0.025em] text-balance">{title}</h2>
      {children && <p className="max-w-[30ch] text-[15px] leading-relaxed text-muted-foreground">{children}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
