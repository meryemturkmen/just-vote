import { cn } from "@/lib/utils";

export function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-white/[0.06]", className)} />;
}

/** Placeholder shaped like a question: title, two photos, chip. */
export function QuestionSkeleton({ full }: { full?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-3 px-4 py-4", full && "h-full")} aria-label="Loading" role="status">
      <Bone className="h-6 w-24 rounded-full" />
      <Bone className="h-8 w-3/4" />
      <div className={cn("grid gap-3", full ? "min-h-0 flex-1 grid-rows-2" : "grid-rows-2")}>
        <Bone className={full ? "h-full" : "h-48"} />
        <Bone className={full ? "h-full" : "h-48"} />
      </div>
    </div>
  );
}

export function ListSkeleton({ rows = 3, h = "h-24" }: { rows?: number; h?: string }) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => <Bone key={i} className={h} />)}
    </div>
  );
}
