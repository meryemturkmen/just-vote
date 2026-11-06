import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Share2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { CategoryTag, Chip } from "@/components/CategoryChips";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  COMMENT_MAX, FEEDBACK_TAGS, castVote, displayTitle, fetchFeedback, fetchQuestion,
  isClosed, myVoterId, decisionLabel, percent, sendFeedback, shareQuestion, timeLeft, type Question,
} from "@/lib/questions";
import { cn } from "@/lib/utils";
import { ReportButton } from "@/components/ReportButton";

export const Route = createFileRoute("/q/$id")({
  head: () => ({
    meta: [
      { title: "Which would you buy? — Just Vote" },
      { name: "description", content: "Tap the one you'd rather buy and help decide on Just Vote." },
      { property: "og:title", content: "Which would you buy? — Just Vote" },
      { property: "og:description", content: "Tap the one you'd rather buy and help decide on Just Vote." },
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
      <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground">
        <ArrowLeft className="size-4" /> Feed
      </Link>
      {isLoading && <div className="h-[70vh] animate-pulse rounded-3xl bg-muted" />}
      {!isLoading && !q && <p className="text-muted-foreground">This question doesn't exist anymore.</p>}
      {q && (
        <>
          <Context q={q} />
          <Photos q={q} onVote={(c) => vote.mutate(c)} pending={vote.isPending} />
          {(q.myVote || isClosed(q)) && <Results q={q} />}
          {q.myVote && <FeedbackForm questionId={q.id} />}
          <Button variant="soft" className="mt-6 h-12 w-full" onClick={() => shareQuestion(q.id, displayTitle(q))}>
            <Share2 /> Share link
          </Button>
          <FeedbackList questionId={q.id} />
        </>
      )}
    </AppShell>
  );
}

function Context({ q }: { q: Question }) {
  return (
    <section className="mb-5">
      <div className="flex flex-wrap items-center gap-1.5">
        <CategoryTag category={q.category} />
        <span className="ml-auto text-xs font-medium text-muted-foreground">{timeLeft(q.ends_at)}</span>
      </div>
      <h1 className="mt-3 text-2xl font-bold leading-tight">{displayTitle(q)}</h1>
      {(q.occasion || q.budget) && (
        <dl className="mt-3 flex flex-wrap gap-2 text-sm">
          {q.occasion && <Info label="Occasion" value={q.occasion} />}
          {q.budget && <Info label="Budget" value={q.budget} />}
        </dl>
      )}
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">asked by {q.author}</p>
        <ReportButton questionId={q.id} />
      </div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted px-3 py-1.5">
      <dt className="sr-only">{label}</dt>
      <dd><span className="text-muted-foreground">{label}: </span><span className="font-medium">{value}</span></dd>
    </div>
  );
}

function Photos({ q, onVote, pending }: { q: Question; onVote: (c: "a" | "b") => void; pending: boolean }) {
  const closed = isClosed(q);
  const locked = !!q.myVote || closed || pending;
  const [pa, pb] = percent(q.votesA, q.votesB);
  const show = !!q.myVote || closed;
  return (
    <div className="space-y-4">
      {(["a", "b"] as const).map((c) => {
        const url = c === "a" ? q.option_a_url : q.option_b_url;
        const mine = q.myVote === c;
        const pct = c === "a" ? pa : pb;
        return (
          <button
            key={c}
            type="button"
            disabled={locked}
            onClick={() => onVote(c)}
            aria-label={`Vote for option ${c.toUpperCase()}`}
            className={cn(
              "relative block w-full overflow-hidden rounded-3xl bg-muted ring-4 ring-transparent transition active:scale-[0.99] disabled:cursor-default",
              mine && "ring-primary",
            )}
          >
            {url && <img src={url} alt={`Option ${c.toUpperCase()}`} className="aspect-[4/5] w-full object-cover" />}
            <span className="absolute left-3 top-3 grid size-10 place-items-center rounded-full bg-card font-display text-lg font-bold shadow-card">
              {c.toUpperCase()}
            </span>
            {mine && (
              <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                <Check className="size-3.5" /> Your vote
              </span>
            )}
            {show && (
              <span className="absolute bottom-3 right-3 rounded-full bg-card px-3 py-1.5 font-display text-lg font-bold shadow-card">
                {pct}%
              </span>
            )}
            {!locked && (
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/60 to-transparent p-4 text-left text-sm font-semibold text-primary-foreground">
                Tap to vote
              </span>
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
  const lead = total === 0 ? "No votes yet" : pa === pb ? "It's a tie!" : closed ? (pa > pb ? "A won" : "B won") : pa > pb ? "A is winning" : "B is winning";
  return (
    <section className="mt-6 rounded-3xl bg-primary-soft p-5">
      {closed && <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent-foreground">Final results</p>}
      {decided && <p className="mb-3 inline-flex rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">The asker {decided.toLowerCase()} 🎉</p>}
      <div className="flex items-baseline justify-between">
        <p className="font-display text-lg font-semibold">{lead}</p>
        <p className="text-sm font-medium text-muted-foreground">{total} {total === 1 ? "vote" : "votes"}</p>
      </div>
      <div className="mt-4 space-y-3">
        <Bar label="A" pct={pa} n={q.votesA} mine={q.myVote === "a"} />
        <Bar label="B" pct={pb} n={q.votesB} mine={q.myVote === "b"} />
      </div>
    </section>
  );
}

function Bar({ label, pct, n, mine }: { label: string; pct: number; n: number; mine: boolean }) {
  return (
    <div>
      <div className="flex justify-between text-sm font-medium">
        <span>Option {label}{mine && " · you"}</span>
        <span>{pct}% <span className="text-muted-foreground">({n})</span></span>
      </div>
      <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-card">
        <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
    </div>
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
    onSuccess: () => { toast.success("Thanks for the tip! 💛"); qc.invalidateQueries({ queryKey: ["feedback", questionId] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  if (!voterId || list?.some((f) => f.voter_id === voterId)) return null;

  return (
    <section className="mt-5 rounded-3xl border bg-card p-5 shadow-card">
      <p className="font-display font-semibold">Why this one? <span className="text-sm font-normal text-muted-foreground">· optional</span></p>
      <div className="mt-3 flex flex-wrap gap-2">
        {FEEDBACK_TAGS.map((t) => (
          <Chip key={t} active={tags.includes(t)} onClick={() => setTags(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t])}>{t}</Chip>
        ))}
      </div>
      <Textarea
        className="mt-3 min-h-20 rounded-2xl"
        placeholder="A quick thought for the asker…"
        maxLength={COMMENT_MAX}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{comment.length}/{COMMENT_MAX}</span>
        <Button variant="hero" className="h-10 px-5" disabled={send.isPending || (!tags.length && !comment.trim())} onClick={() => send.mutate()}>
          Send
        </Button>
      </div>
    </section>
  );
}

function FeedbackList({ questionId }: { questionId: string }) {
  const { data } = useQuery({ queryKey: ["feedback", questionId], queryFn: () => fetchFeedback(questionId) });
  if (!data?.length) return null;
  const counts = FEEDBACK_TAGS.map((t) => [t, data.filter((f) => f.tags.includes(t)).length] as const).filter(([, n]) => n > 0);
  const comments = data.filter((f) => f.comment);
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">What voters said</h2>
      {counts.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {counts.map(([t, n]) => (
            <span key={t} className="rounded-full bg-muted px-3 py-1.5 text-sm font-medium">{t} <span className="text-primary">{n}</span></span>
          ))}
        </div>
      )}
      <ul className="mt-4 space-y-2">
        {comments.map((f) => (
          <li key={f.id} className="rounded-2xl bg-muted px-4 py-3 text-sm">“{f.comment}”</li>
        ))}
      </ul>
    </section>
  );
}
