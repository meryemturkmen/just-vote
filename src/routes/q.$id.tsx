import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { QuestionCard } from "@/components/QuestionCard";
import { fetchQuestion, percent } from "@/lib/questions";

export const Route = createFileRoute("/q/$id")({
  head: () => ({
    meta: [
      { title: "Which would you buy? — Just Vote" },
      { name: "description", content: "Help decide between two products on Just Vote." },
      { property: "og:title", content: "Which would you buy? — Just Vote" },
      { property: "og:description", content: "Help decide between two products on Just Vote." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Detail,
});

function Detail() {
  const { id } = Route.useParams();
  const { data: q, isLoading } = useQuery({ queryKey: ["questions", "one", id], queryFn: () => fetchQuestion(id) });

  return (
    <AppShell>
      <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground">
        <ArrowLeft className="size-4" /> Back to feed
      </Link>
      {isLoading && <div className="h-96 animate-pulse rounded-3xl bg-muted" />}
      {!isLoading && !q && <p className="text-muted-foreground">This question doesn't exist anymore.</p>}
      {q && (
        <>
          <QuestionCard q={q} linked={false} />
          <Results q={q} />
        </>
      )}
    </AppShell>
  );
}

function Results({ q }: { q: NonNullable<Awaited<ReturnType<typeof fetchQuestion>>> }) {
  const [pa, pb] = percent(q.votesA, q.votesB);
  const total = q.votesA + q.votesB;
  if (!q.myVote) return <p className="mt-5 text-center text-sm text-muted-foreground">Vote to see the results ✨</p>;
  const lead = total === 0 ? null : pa === pb ? "It's a tie!" : pa > pb ? `${q.option_a_label} is winning` : `${q.option_b_label} is winning`;
  return (
    <div className="mt-5 rounded-3xl bg-primary-soft p-5">
      <p className="font-display text-lg font-semibold">{lead}</p>
      <div className="mt-3 space-y-2 text-sm">
        <Row label={q.option_a_label} pct={pa} n={q.votesA} />
        <Row label={q.option_b_label} pct={pb} n={q.votesB} />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">You can change your vote anytime.</p>
    </div>
  );
}

function Row({ label, pct, n }: { label: string; pct: number; n: number }) {
  return (
    <div>
      <div className="flex justify-between font-medium">
        <span className="truncate">{label}</span>
        <span>{pct}% · {n}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-card">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
