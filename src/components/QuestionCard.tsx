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
import { Check, ChevronRight, Clock, MessageCircle, Rocket, ShoppingBag, X } from "lucide-react";

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
        {isBoosted(q) && <Sticker className="text-moss"><Rocket className="size-3" strokeWidth={2} /> Boosted</Sticker>}
        <span className="ml-auto inline-flex items-center gap-1 text-[12px] font-medium tabular-nums text-muted-foreground"><Clock className="size-3.5" strokeWidth={1.8} />{timeLeft(q.ends_at)}</span>
        <ReportButton questionId={q.id} compact />
      </div>
      <Link to="/q/$id" params={{ id: q.id }} className="font-display text-[26px] font-bold leading-[1.1] tracking-[-0.025em] text-balance">
        {displayTitle(q)}
      </Link>
      {(q.occasion || q.budget) && (
        <div className="-mt-1 flex flex-wrap gap-2">
          {q.occasion && <Sticker>For {q.occasion}</Sticker>}
          {q.budget && <Sticker>Budget {q.budget}</Sticker>}
        </div>
      )}

      {q.kind === "buyskip" ? (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-[28px] bg-muted brut">
            {q.options[0]?.url && <img src={q.options[0].url} alt="The item" className="absolute inset-0 size-full object-cover" />}
          </div>
          {show ? (
            <div className="space-y-2">
              {q.options.map((o) => (
                <AnimatedBar key={o.key} label={o.key === "a" ? "Buy it" : "Skip it"} pct={o.pct} highlight={q.myVote === o.key} color={OPTION_COLORS[o.key]} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {q.options.map((o) => (
                <button key={o.key} type="button" disabled={vote.isPending} onClick={() => vote.mutate(o.key)}
                  className={cn("flex h-14 items-center justify-center gap-2 rounded-full text-[17px] font-semibold press", o.key === "a" ? "bg-chrome" : "border border-border bg-white/[0.06]")}>
                  {o.key === "a" ? <><ShoppingBag className="size-5" strokeWidth={1.8} /> Buy it</> : <><X className="size-5" strokeWidth={1.8} /> Skip it</>}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
      <div className={cn("relative grid min-h-0 flex-1 grid-cols-2 gap-2.5", n > 2 && "grid-rows-2")}>
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
          <span className="pointer-events-none absolute left-1/2 top-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full glass text-[13px] font-semibold tracking-wide">
            or
          </span>
        )}
      </div>
      )}

      {show ? (
        <div className="space-y-3">
          <p className="animate-pop font-display text-[20px] font-semibold leading-tight tracking-[-0.015em]">
            {q.myVote ? verdictLine(myPct, total) : "Voting's closed. Here's how it landed."}
          </p>
          <div className="flex items-center gap-2">
            <Link to="/q/$id" params={{ id: q.id }} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white/[0.05] px-3.5 py-2 text-[13px] font-medium press">
              <MessageCircle className="size-4" strokeWidth={1.8} /> {q.commentCount} {q.commentCount === 1 ? "comment" : "comments"}
              <ChevronRight className="size-4 text-muted-foreground" strokeWidth={1.8} />
            </Link>
          </div>
          <ShareButtons q={q} />
        </div>
      ) : (
        <p className="text-center text-[13px] text-muted-foreground">
          Tap a photo to vote <span className="mx-1 opacity-50">·</span> <span className="tabular-nums">{total}</span> voted <span className="mx-1 opacity-50">·</span> <MessageCircle className="inline size-3.5 align-[-2px]" strokeWidth={1.8} /> <span className="tabular-nums">{q.commentCount}</span>
        </p>
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
        "group relative min-h-0 overflow-hidden rounded-[24px] bg-muted brut press disabled:cursor-default",
        wide && "col-span-2",
        mine && "ring-iridescent",
      )}
    >
      {url && <img src={url} alt={`Option ${side.toUpperCase()}`} className={cn("absolute inset-0 size-full object-cover transition-[filter,transform] duration-700", show && !mine && "brightness-[0.6] saturate-[0.7]")} />}
      <span className="absolute left-2.5 top-2.5 grid size-8 place-items-center rounded-full glass text-[13px] font-semibold">
        {side.toUpperCase()}
      </span>
      {show && (
        <>
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute inset-x-3 bottom-3 text-left">
            <span className="block font-display text-[40px] font-bold leading-none tracking-[-0.04em] tabular-nums text-white">{pct}<span className="text-[22px] font-semibold opacity-70">%</span></span>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-chrome shadow-none transition-[width] duration-1000 ease-[var(--ease-spring)]" style={{ width: `${h}%` }} />
            </div>
          </div>
        </>
      )}
      {mine && (
        <span className="animate-pop absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-chrome px-2.5 py-1 text-[11px] font-semibold">
          <Check className="size-3" strokeWidth={2.5} /> Your pick
        </span>
      )}
    </button>
  );
}
