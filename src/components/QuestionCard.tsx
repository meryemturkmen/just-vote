import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { castVote, displayTitle, isBoosted, isClosed, OPTION_COLORS, timeLeft, totals, withVote, type Choice, type Question } from "@/lib/questions";
import { verdictLine } from "@/lib/copy";
import { AnimatedBar } from "@/components/AnimatedBar";
import { cn } from "@/lib/utils";
import { CategoryTag, Sticker } from "@/components/CategoryChips";
import { ReportButton } from "@/components/ReportButton";
import { ShareButtons } from "@/components/ShareButtons";

/** One full-screen feed slide: tap a photo to vote, results animate in. */
export function QuestionCard({ q: initial }: { q: Question }) {
  const qc = useQueryClient();
  const [q, setQ] = useState(initial);
  const vote = useMutation({
    mutationFn: (c: Choice) => castVote(q.id, c),
    onSuccess: (_d, c) => {
      setQ((p) => withVote(p, c));
      qc.invalidateQueries({ queryKey: ["questions", "one", q.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const closed = isClosed(q);
  const show = q.myVote !== null || closed;
  const { total, mine: myPct } = totals(q);
  const n = q.options.length;

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

      {q.kind === "buyskip" ? (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl bg-muted brut rotate-[-0.6deg]">
            {q.options[0]?.url && <img src={q.options[0].url} alt="The item" className="absolute inset-0 size-full object-cover" />}
          </div>
          {show ? (
            <div className="space-y-2">
              {q.options.map((o) => (
                <AnimatedBar key={o.key} label={o.key === "a" ? "🛒 Buy it" : "🙅 Skip it"} pct={o.pct} highlight={q.myVote === o.key} color={OPTION_COLORS[o.key]} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {q.options.map((o) => (
                <button key={o.key} type="button" disabled={vote.isPending} onClick={() => vote.mutate(o.key)}
                  className={cn("h-16 rounded-xl font-display text-xl font-extrabold brut press", o.key === "a" ? "bg-lime tilt-l" : "bg-pink tilt-r")}>
                  {o.key === "a" ? "🛒 Buy it" : "🙅 Skip it"}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
      <div className={cn("relative grid min-h-0 flex-1 grid-cols-2 gap-3", n > 2 && "grid-rows-2")}>
        {q.options.map((o, i) => (
          <PhotoTile
            key={o.key}
            side={o.key}
            url={o.url}
            pct={o.pct}
            mine={q.myVote === o.key}
            show={show}
            disabled={vote.isPending || show}
            onVote={() => vote.mutate(o.key)}
            wide={n === 3 && i === 2}
          />
        ))}
        {!show && n === 2 && (
          <span className="pointer-events-none absolute left-1/2 top-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 rotate-[-8deg] place-items-center rounded-full bg-primary font-display text-xl font-extrabold brut">
            VS
          </span>
        )}
      </div>
      )}

      {show ? (
        <div className="space-y-3">
          <p className="animate-pop inline-block rounded-lg bg-yellow px-3 py-2 font-display text-lg font-extrabold leading-tight brut-sm">
            {q.myVote ? verdictLine(myPct, total) : "Voting's over. Here's the tea ☕"}
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

function PhotoTile({ side, url, pct, mine, show, disabled, onVote, wide }: {
  side: Choice; url: string; pct: number; mine: boolean; show: boolean; disabled: boolean; onVote: () => void; wide?: boolean;
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
        side === "a" || side === "c" ? "rotate-[-1deg]" : "rotate-[1deg]",
        wide && "col-span-2",
        mine && "ring-4 ring-primary ring-offset-2 ring-offset-background",
      )}
    >
      {url && <img src={url} alt={`Option ${side.toUpperCase()}`} className="absolute inset-0 size-full object-cover" />}
      <span className={cn("absolute left-2 top-2 grid size-10 place-items-center rounded-lg font-display text-xl font-extrabold brut-sm", OPTION_COLORS[side], side === "a" || side === "c" ? "tilt-l" : "tilt-r")}>
        {side.toUpperCase()}
      </span>
      {show && (
        <>
          <div
            className={cn("absolute inset-x-0 bottom-0 border-t-2 opacity-85 transition-[height] duration-1000 ease-out", OPTION_COLORS[side])}
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
