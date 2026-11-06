import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { castVote, displayTitle, isClosed, percent, timeLeft, type Question } from "@/lib/questions";
import { cn } from "@/lib/utils";
import { CategoryTag } from "@/components/CategoryChips";

export function QuestionCard({ q, linked = true }: { q: Question; linked?: boolean }) {
  const qc = useQueryClient();
  const vote = useMutation({
    mutationFn: (c: "a" | "b") => castVote(q.id, c),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["questions"] }),
    onError: (e: Error) => toast.error(e.message),
  });
  const closed = isClosed(q);
  const voted = q.myVote !== null || closed;
  const [pa, pb] = percent(q.votesA, q.votesB);
  const total = q.votesA + q.votesB;

  const option = (c: "a" | "b") => {
    const url = c === "a" ? q.option_a_url : q.option_b_url;
    const label = c === "a" ? q.option_a_label : q.option_b_label;
    const pct = c === "a" ? pa : pb;
    const mine = q.myVote === c;
    return (
      <button
        type="button"
        disabled={vote.isPending || closed}
        onClick={() => vote.mutate(c)}
        className={cn(
          "group relative overflow-hidden rounded-2xl bg-muted text-left ring-2 ring-transparent transition",
          mine && "ring-primary",
        )}
      >
        <div className="aspect-[3/4] w-full overflow-hidden">
          {url && <img src={url} alt={label} className="size-full object-cover transition group-active:scale-95" />}
        </div>
        <div className="p-3">
          <p className="truncate text-sm font-semibold">{label}</p>
          {voted ? (
            <div className="mt-2">
              <div className="h-1.5 overflow-hidden rounded-full bg-border">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-1 text-xs font-medium text-muted-foreground">{pct}%</p>
            </div>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">Tap to vote</p>
          )}
        </div>
        {mine && (
          <span className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-primary text-primary-foreground">
            <Check className="size-4" />
          </span>
        )}
      </button>
    );
  };

  return (
    <article className="rounded-3xl border bg-card p-4 shadow-card">
      <div className="flex flex-wrap items-center gap-1.5">
        <CategoryTag category={q.category} />
        {q.occasion && <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">🎉 {q.occasion}</span>}
        {q.budget && <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">💸 {q.budget}</span>}
        <span className="ml-auto text-[11px] font-medium text-muted-foreground">{timeLeft(q.ends_at)}</span>
      </div>
      <div className="mb-3 mt-2 flex items-baseline justify-between gap-3">
        {linked ? (
          <Link to="/q/$id" params={{ id: q.id }} className="font-display text-lg font-semibold leading-snug">
            {displayTitle(q)}
          </Link>
        ) : (
          <h2 className="text-lg font-semibold leading-snug">{displayTitle(q)}</h2>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {option("a")}
        {option("b")}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        by {q.author} · {total} {total === 1 ? "vote" : "votes"}
      </p>
    </article>
  );
}
