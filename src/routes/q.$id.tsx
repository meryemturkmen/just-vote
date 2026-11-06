import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { CategoryTag, Chip, Sticker } from "@/components/CategoryChips";
import { AnimatedBar } from "@/components/AnimatedBar";
import { ShareButtons } from "@/components/ShareButtons";
import { ReportButton } from "@/components/ReportButton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  COMMENT_MAX, FEEDBACK_TAGS, castVote, decisionLabel, displayTitle, fetchFeedback, fetchQuestion,
  isClosed, myVoterId, percent, sendFeedback, timeLeft, type Question,
} from "@/lib/questions";
import { myShare, verdictLine } from "@/lib/copy";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/q/$id")({
  head: () => ({
    meta: [
      { title: "Which one?? — Just Vote" },
      { name: "description", content: "Pick one. No pressure. Your vote decides." },
      { property: "og:title", content: "Which one?? — Just Vote" },
      { property: "og:description", content: "Pick one. No pressure. Your vote decides." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Detail,
});

function Detail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { data: q, isLoading } = useQuery({ queryKey: ["questions", "one", id], queryFn: () => fetchQuestion(id) });
  const vote = useMutation({
    mutationFn: (c: "a" | "b") => castVote(id, c),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["questions"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell>
      <Link to="/" className="mb-5 inline-flex items-center gap-1 rounded-lg bg-card px-3 py-1.5 text-sm font-bold brut-sm press">
        <ArrowLeft className="size-4" strokeWidth={3} /> Feed
      </Link>
      {isLoading && <p className="animate-wiggle inline-block rounded-lg bg-yellow px-4 py-2 font-display text-xl font-extrabold brut">Loading…</p>}
      {!isLoading && !q && (
        <p className="tilt-l inline-block rounded-lg bg-lime px-4 py-3 font-display text-2xl font-extrabold brut">This one's gone. Poof 💨</p>
      )}
      {q && (
        <>
          <Context q={q} />
          <Photos q={q} onVote={(c) => vote.mutate(c)} pending={vote.isPending} />
          {(q.myVote || isClosed(q)) && <Results q={q} />}
          {q.myVote && <FeedbackForm questionId={q.id} />}
          <div className="mt-6"><ShareButtons q={q} /></div>
          <FeedbackList questionId={q.id} />
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
        <Sticker className="bg-card">⏰ {timeLeft(q.ends_at)}</Sticker>
        <span className="ml-auto"><ReportButton questionId={q.id} /></span>
      </div>
      <h1 className="mt-4 text-[34px] leading-[1]">{displayTitle(q)}</h1>
      {(q.occasion || q.budget) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {q.occasion && <Sticker>🎉 For: {q.occasion}</Sticker>}
          {q.budget && <Sticker className="tilt-l">💸 Budget: {q.budget}</Sticker>}
        </div>
      )}
      <p className="mt-3 text-sm font-medium">asked by <span className="font-extrabold">{q.author}</span></p>
    </section>
  );
}

function Photos({ q, onVote, pending }: { q: Question; onVote: (c: "a" | "b") => void; pending: boolean }) {
  const closed = isClosed(q);
  const locked = !!q.myVote || closed || pending;
  const [pa, pb] = percent(q.votesA, q.votesB);
  const show = !!q.myVote || closed;
  return (
    <div className="space-y-5">
      {(["a", "b"] as const).map((c) => {
        const url = c === "a" ? q.option_a_url : q.option_b_url;
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
              "relative block w-full overflow-hidden rounded-2xl border-2 bg-muted shadow-brut-lg press disabled:cursor-default",
              c === "a" ? "rotate-[-0.8deg]" : "rotate-[0.8deg]",
              mine && "ring-4 ring-primary ring-offset-2 ring-offset-background",
            )}
          >
            {url && <img src={url} alt={`Option ${c.toUpperCase()}`} className="aspect-[4/5] w-full object-cover" />}
            <span className={cn("absolute left-3 top-3 grid size-12 place-items-center rounded-xl font-display text-2xl font-extrabold brut-sm", c === "a" ? "bg-yellow tilt-l" : "bg-lime tilt-r")}>
              {c.toUpperCase()}
            </span>
            {mine && <span className="animate-pop absolute right-3 top-3 rounded-md bg-primary px-2.5 py-1 text-xs font-extrabold uppercase brut-sm">My pick</span>}
            {won && <span className="animate-pop absolute bottom-16 right-3 rounded-md bg-lime px-2.5 py-1 text-xs font-extrabold uppercase brut-sm">They bought it 🛍️</span>}
            {show && (
              <span className="absolute bottom-3 right-3 rounded-lg bg-card px-3 py-1 font-display text-2xl font-extrabold brut-sm">
                {c === "a" ? pa : pb}%
              </span>
            )}
            {!locked && (
              <span className="absolute bottom-3 left-3 rounded-lg bg-card px-3 py-1.5 text-sm font-extrabold brut-sm">Tap to pick 👆</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function Results({ q }: { q: Question }) {
  const [pa, pb] = percent(q.votesA, q.votesB);
  const total = q.votesA + q.votesB;
  const closed = isClosed(q);
  const decided = decisionLabel(q.decided_choice);
  const line = q.myVote ? verdictLine(myShare(q.myVote, pa, pb), total) : "Voting's over. Here's the tea ☕";
  return (
    <section className="mt-8 rounded-2xl bg-card p-5 brut">
      <div className="flex items-center justify-between">
        <p className="font-display text-sm font-extrabold uppercase">{closed ? "Final results 🏁" : "Live results"}</p>
        <p className="text-sm font-bold">{total} {total === 1 ? "vote" : "votes"}</p>
      </div>
      <p className="animate-pop mt-3 inline-block rounded-lg bg-yellow px-3 py-2 font-display text-xl font-extrabold leading-tight brut-sm">{line}</p>
      {decided && <p className="mt-3 inline-block rounded-md bg-primary px-3 py-1 text-xs font-extrabold uppercase brut-sm">The asker {decided.toLowerCase()} 🎉</p>}
      <div className="mt-4 space-y-3">
        <AnimatedBar label="A" pct={pa} highlight={q.myVote === "a"} color="bg-yellow" />
        <AnimatedBar label="B" pct={pb} highlight={q.myVote === "b"} color="bg-lime" />
      </div>
    </section>
  );
}

function FeedbackForm({ questionId }: { questionId: string }) {
  const qc = useQueryClient();
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [voterId, setVoterId] = useState<string | undefined>();
  useEffect(() => { myVoterId().then((v) => setVoterId(v.id)); }, []);
  const { data: list } = useQuery({ queryKey: ["feedback", questionId], queryFn: () => fetchFeedback(questionId) });
  const send = useMutation({
    mutationFn: () => sendFeedback(questionId, tags, comment),
    onSuccess: () => { toast.success("Noted. You're a real one 💅"); qc.invalidateQueries({ queryKey: ["feedback", questionId] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  if (!voterId || list?.some((f) => f.voter_id === voterId)) return null;

  return (
    <section className="mt-6 rounded-2xl bg-lime p-5 brut">
      <p className="font-display text-xl font-extrabold">Why tho? <span className="text-sm font-bold">(optional)</span></p>
      <div className="mt-3 flex flex-wrap gap-2">
        {FEEDBACK_TAGS.map((t) => (
          <Chip key={t} active={tags.includes(t)} onClick={() => setTags(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t])}>{t}</Chip>
        ))}
      </div>
      <Textarea
        className="mt-3 min-h-20 rounded-xl bg-card"
        placeholder="Spill it. 140 chars max."
        maxLength={COMMENT_MAX}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs font-bold">{comment.length}/{COMMENT_MAX}</span>
        <Button variant="hero" className="px-6" disabled={send.isPending || (!tags.length && !comment.trim())} onClick={() => send.mutate()}>
          Send it
        </Button>
      </div>
    </section>
  );
}

function FeedbackList({ questionId }: { questionId: string }) {
  const { data } = useQuery({ queryKey: ["feedback", questionId], queryFn: () => fetchFeedback(questionId) });
  if (!data?.length) return null;
  const counts = FEEDBACK_TAGS.map((t) => [t, data.filter((f) => f.tags.includes(t)).length] as const)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);
  const comments = data.filter((f) => f.comment);
  return (
    <section className="mt-10">
      <h2 className="text-2xl">The comments section 🍿</h2>
      {counts.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {counts.map(([t, n], i) => (
            <span key={t} className={cn("rounded-md bg-card px-3 py-1.5 text-sm font-extrabold brut-sm", i % 2 ? "tilt-r" : "tilt-l")}>
              {t} <span className="rounded bg-primary px-1.5">{n}</span>
            </span>
          ))}
        </div>
      )}
      <ul className="mt-5 space-y-3">
        {comments.map((f, i) => (
          <li key={f.id} className={cn("rounded-xl bg-card px-4 py-3 text-sm font-medium brut-sm", i % 2 ? "rotate-[0.6deg]" : "rotate-[-0.6deg]")}>
            “{f.comment}”
          </li>
        ))}
      </ul>
    </section>
  );
}
