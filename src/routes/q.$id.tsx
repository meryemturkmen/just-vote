import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Check, ChevronLeft, Clock, Lock, ShoppingBag, X } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { QuestionSkeleton } from "@/components/Skeleton";
import { AppShell } from "@/components/AppShell";
import { CategoryTag, Sticker } from "@/components/CategoryChips";
import { AnimatedBar } from "@/components/AnimatedBar";
import { ShareButtons } from "@/components/ShareButtons";
import { ReportButton } from "@/components/ReportButton";
import { CommentSection } from "@/components/CommentSection";
import {
  castVote, decisionLabel, displayTitle, fetchQuestion, isClosed, OPTION_COLORS, timeLeft, totals, type Choice, type Question,
} from "@/lib/questions";
import { verdictLine } from "@/lib/copy";
import { cn } from "@/lib/utils";
import { logShareEvent } from "@/lib/share-events";

const SITE = "https://just-vote.lovable.app";

export const Route = createFileRoute("/q/$id")({
  head: ({ params }) => {
    const url = `${SITE}/q/${params.id}`;
    const img = `${SITE}/api/public/og/${params.id}`;
    return {
      meta: [
        { title: "Which one would you pick? — Just Vote" },
        { name: "description", content: "Pick one. No pressure. Tap to vote, no login needed." },
        { property: "og:title", content: "Which one would you pick?" },
        { property: "og:description", content: "Pick one. No pressure. Tap to vote, no login needed." },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { property: "og:site_name", content: "Just Vote" },
        { property: "og:image", content: img },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:image:type", content: "image/jpeg" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: "Which one would you pick?" },
        { name: "twitter:description", content: "Pick one. No pressure. Tap to vote, no login needed." },
        { name: "twitter:image", content: img },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: Detail,
});

function Detail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  useEffect(() => {
    const u = new URL(window.location.href);
    if (u.searchParams.get("s") !== "1") return;
    logShareEvent("link_open", id, "direct");
    window.__lovableEvents?.track?.("project.shared_link_opened", {});
    u.searchParams.delete("s");
    window.history.replaceState(window.history.state, "", u.pathname + u.search + u.hash);
  }, [id]);
  const { data: q, isLoading } = useQuery({ queryKey: ["questions", "one", id], queryFn: () => fetchQuestion(id) });
  const vote = useMutation({
    mutationFn: (c: Choice) => castVote(id, c),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["questions"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell>
      <Link to="/" className="-ml-1.5 mb-4 inline-flex items-center gap-0.5 text-[17px] text-foreground/80 press">
        <ChevronLeft className="size-6" strokeWidth={1.8} /> Feed
      </Link>
      {isLoading && <QuestionSkeleton />}
      {!isLoading && !q && (
        <EmptyState className="py-16" title="This question is gone" action={<Link to="/" className="text-[15px] font-medium underline underline-offset-4">Back to the feed</Link>}>
          It expired, was deleted, or the link is broken.
        </EmptyState>
      )}
      {q && (
        <>
          <Context q={q} />
          <Photos q={q} onVote={(c) => vote.mutate(c)} pending={vote.isPending} />
          {(q.myVote || isClosed(q)) && <Results q={q} />}
          <div className="mt-6"><ShareButtons q={q} /></div>
          {q.myVote ? (
            <CommentSection q={q} />
          ) : (
            <p className="mt-8 flex items-center gap-3 rounded-2xl bg-card px-4 py-3.5 text-[15px] text-muted-foreground brut-sm"><Lock className="size-4 shrink-0" strokeWidth={1.8} /> Vote to see {q.commentCount} {q.commentCount === 1 ? "comment" : "comments"}.</p>
          )}
        </>
      )}
    </AppShell>
  );
}

function Context({ q }: { q: Question }) {
  return (
    <section className="mb-5">
      <div className="flex flex-wrap items-center gap-2">
        <CategoryTag category={q.category} />
        <Sticker><Clock className="size-3" strokeWidth={2} /> {timeLeft(q.ends_at)}</Sticker>
        <span className="ml-auto"><ReportButton questionId={q.id} /></span>
      </div>
      <h1 className="mt-4 text-[34px] leading-[1.08] tracking-[-0.03em] text-balance">{displayTitle(q)}</h1>
      {(q.occasion || q.budget) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {q.occasion && <Sticker>For {q.occasion}</Sticker>}
          {q.budget && <Sticker>Budget {q.budget}</Sticker>}
        </div>
      )}
      <p className="mt-3 text-[14px] text-muted-foreground">Asked by <span className="font-medium text-foreground">{q.author}</span></p>
    </section>
  );
}

function Photos({ q, onVote, pending }: { q: Question; onVote: (c: Choice) => void; pending: boolean }) {
  const closed = isClosed(q);
  const locked = !!q.myVote || closed || pending;
  const show = !!q.myVote || closed;
  if (q.kind === "buyskip") {
    const o = q.options[0];
    return (
      <div className="space-y-5">
        <div className="relative overflow-hidden rounded-[28px] bg-muted brut">
          {o?.url && <img src={o.url} alt="The item" className="aspect-[4/5] w-full object-cover" />}
          {q.decided_choice === "a" && <span className="animate-pop absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-lime px-3 py-1.5 text-[12px] font-semibold"><Check className="size-3.5" strokeWidth={2.2} /> They bought it</span>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {q.options.map((x) => (
            <button key={x.key} type="button" disabled={locked} onClick={() => onVote(x.key)}
              className={cn("flex h-14 items-center justify-center gap-2 rounded-full text-[17px] font-semibold press disabled:cursor-default", x.key === "a" ? "bg-chrome" : "border border-border bg-white/[0.06]", q.myVote === x.key && "ring-iridescent", show && q.myVote !== x.key && "opacity-60")}>
              {x.key === "a" ? <><ShoppingBag className="size-5" strokeWidth={1.8} /> Buy it</> : <><X className="size-5" strokeWidth={1.8} /> Skip it</>}{show && <span className="tabular-nums opacity-60">{x.pct}%</span>}
            </button>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-5">
      {q.options.map(({ key: c, url, pct }) => {
        const mine = q.myVote === c;
        const won = q.decided_choice === c;
        return (
          <button
            key={c}
            type="button"
            disabled={locked}
            onClick={() => onVote(c)}
            aria-label={`Vote for option ${c.toUpperCase()}`}
            className={cn(
              "relative block w-full overflow-hidden rounded-[28px] bg-muted brut press disabled:cursor-default",
              mine && "ring-iridescent",
            )}
          >
            {url && <img src={url} alt={`Option ${c.toUpperCase()}`} className="aspect-[4/5] w-full object-cover" />}
            <span className="absolute left-3 top-3 grid size-9 place-items-center rounded-full glass text-[15px] font-semibold">
              {c.toUpperCase()}
            </span>
            {mine && <span className="animate-pop absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-chrome px-3 py-1.5 text-[12px] font-semibold"><Check className="size-3.5" strokeWidth={2.5} /> Your pick</span>}
            {won && <span className="animate-pop absolute bottom-16 right-3 inline-flex items-center gap-1 rounded-full bg-lime px-3 py-1.5 text-[12px] font-semibold"><Check className="size-3.5" strokeWidth={2.2} /> They bought it</span>}
            {show && (
              <span className="absolute bottom-3 right-3 rounded-full glass px-3.5 py-1.5 font-display text-[22px] font-bold tabular-nums tracking-[-0.03em]">
                {pct}%
              </span>
            )}
            {!locked && (
              <span className="absolute bottom-3 left-3 rounded-full glass px-3.5 py-2 text-[13px] font-medium">Tap to pick</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function Results({ q }: { q: Question }) {
  const { total, mine } = totals(q);
  const closed = isClosed(q);
  const decided = decisionLabel(q.decided_choice, q.kind);
  const line = q.myVote ? verdictLine(mine, total) : "Voting's closed. Here's how it landed.";
  return (
    <section className="mt-8">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{closed ? "Final results" : "Live results"}</p>
        <p className="text-[13px] tabular-nums text-muted-foreground">{total} {total === 1 ? "vote" : "votes"}</p>
      </div>
      <p className="animate-pop mt-2 font-display text-[22px] font-semibold leading-tight tracking-[-0.02em]">{line}</p>
      {decided && <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-lime px-3 py-1.5 text-[12px] font-semibold"><Check className="size-3.5" strokeWidth={2.2} /> The asker {decided.toLowerCase()}</p>}
      <div className="mt-4 space-y-3">
        {q.options.map((o) => (
          <AnimatedBar key={o.key} label={o.label} pct={o.pct} highlight={q.myVote === o.key} color={OPTION_COLORS[o.key]} />
        ))}
      </div>
    </section>
  );
}
