import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { castVote, displayTitle, isBoosted, isClosed, percent, timeLeft, type Question } from "@/lib/questions";
import { myShare, verdictLine } from "@/lib/copy";
import { cn } from "@/lib/utils";
import { CategoryTag, Sticker } from "@/components/CategoryChips";
import { ReportButton } from "@/components/ReportButton";
import { ShareButtons } from "@/components/ShareButtons";

/** One full-screen feed slide: tap a photo to vote, results animate in. */
export function QuestionCard({ q: initial }: { q: Question }) {
  const qc = useQueryClient();
  const [q, setQ] = useState(initial);
  const vote = useMutation({
    mutationFn: (c: "a" | "b") => castVote(q.id, c),
    onSuccess: (_d, c) => {
      setQ((p) => ({ ...p, myVote: c, votesA: p.votesA + (c === "a" ? 1 : 0), votesB: p.votesB + (c === "b" ? 1 : 0) }));
      qc.invalidateQueries({ queryKey: ["questions", "one", q.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const closed = isClosed(q);
  const show = q.myVote !== null || closed;
  const [pa, pb] = percent(q.votesA, q.votesB);
  const total = q.votesA + q.votesB;

  return (
    <article className="flex h-full snap-start snap-always flex-col gap-3 px-4 pb-4 pt-3">
      <div className="flex items-center gap-2">
        <CategoryTag category={q.category} />
        {isBoosted(q) && <Sticker className="bg-primary">🚀 Boosted</Sticker>}
        <span className="ml-auto text-xs font-bold">{timeLeft(q.ends_at)}</span>
        <ReportButton questionId={q.id} compact />
      </div>
      <Link to="/q/$id" params={{ id: q.id }} className="font-display text-[26px] font-extrabold leading-[1.05] tracking-tight">
        {displayTitle(q)}
      </Link>
      {(q.occasion || q.budget) && (
        <div className="-mt-1 flex flex-wrap gap-2">
          {q.occasion && <Sticker>🎉 {q.occasion}</Sticker>}
          {q.budget && <Sticker className="tilt-l">💸 {q.budget}</Sticker>}
        </div>
      )}

      <div className="relative grid min-h-0 flex-1 grid-cols-2 gap-3">
        {(["a", "b"] as const).map((c) => (
          <PhotoTile
            key={c}
            side={c}
            url={c === "a" ? q.option_a_url : q.option_b_url}
            pct={c === "a" ? pa : pb}
            mine={q.myVote === c}
            show={show}
            disabled={vote.isPending || show}
            onVote={() => vote.mutate(c)}
          />
        ))}
        {!show && (
          <span className="pointer-events-none absolute left-1/2 top-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 rotate-[-8deg] place-items-center rounded-full bg-primary font-display text-xl font-extrabold brut">
            VS
          </span>
        )}
      </div>

      {show ? (
        <div className="space-y-3">
          <p className="animate-pop inline-block rounded-lg bg-yellow px-3 py-2 font-display text-lg font-extrabold leading-tight brut-sm">
            {q.myVote ? verdictLine(myShare(q.myVote, pa, pb), total) : "Voting's over. Here's the tea ☕"}
          </p>
          <Link to="/q/$id" params={{ id: q.id }} className="inline-block rounded-md bg-card px-2.5 py-1 text-xs font-extrabold brut-sm tilt-r">💬 {q.commentCount} {q.commentCount === 1 ? "comment" : "comments"} →</Link>
          <ShareButtons q={q} />
        </div>
      ) : (
        <p className="text-center text-sm font-bold">Pick one. No pressure. 👆 <span className="text-muted-foreground">· {total} voted · 💬 {q.commentCount}</span></p>
      )}
    </article>
  );
}

function PhotoTile({ side, url, pct, mine, show, disabled, onVote }: {
  side: "a" | "b"; url: string; pct: number; mine: boolean; show: boolean; disabled: boolean; onVote: () => void;
}) {
  const [h, setH] = useState(0);
  useEffect(() => {
    if (!show) return;
    const t = requestAnimationFrame(() => setH(pct));
    return () => cancelAnimationFrame(t);
  }, [show, pct]);
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onVote}
      aria-label={`Vote for option ${side.toUpperCase()}`}
      className={cn(
        "relative min-h-0 overflow-hidden rounded-2xl bg-muted brut press disabled:cursor-default",
        side === "a" ? "rotate-[-1deg]" : "rotate-[1deg]",
        mine && "ring-4 ring-primary ring-offset-2 ring-offset-background",
      )}
    >
      {url && <img src={url} alt={`Option ${side.toUpperCase()}`} className="absolute inset-0 size-full object-cover" />}
      <span className={cn("absolute left-2 top-2 grid size-10 place-items-center rounded-lg font-display text-xl font-extrabold brut-sm", side === "a" ? "bg-yellow tilt-l" : "bg-lime tilt-r")}>
        {side.toUpperCase()}
      </span>
      {show && (
        <>
          <div
            className={cn("absolute inset-x-0 bottom-0 border-t-2 opacity-85 transition-[height] duration-1000 ease-out", side === "a" ? "bg-yellow" : "bg-lime")}
            style={{ height: `${h}%` }}
          />
          <span className="absolute inset-x-0 bottom-3 text-center font-display text-4xl font-extrabold">{pct}%</span>
        </>
      )}
      {mine && (
        <span className="animate-pop absolute right-2 top-2 rounded-md bg-primary px-2 py-1 text-xs font-extrabold uppercase brut-sm">My pick</span>
      )}
    </button>
  );
}
