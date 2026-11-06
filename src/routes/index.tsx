import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { QuestionCard } from "@/components/QuestionCard";
import { Button } from "@/components/ui/button";
import { fetchFeed } from "@/lib/questions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Just Vote — Help others decide" },
      { name: "description", content: "Vote on which product people should buy. Shoes, laptops, sofas and more." },
      { property: "og:title", content: "Just Vote — Help others decide" },
      { property: "og:description", content: "Vote on which product people should buy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Feed,
});

function Feed() {
  const { data, isLoading } = useQuery({ queryKey: ["questions", "feed"], queryFn: fetchFeed });
  return (
    <AppShell title="Help someone decide">
      <p className="-mt-1 mb-5 text-sm text-muted-foreground">Tap the one you'd rather buy. 💛</p>
      {isLoading && <div className="space-y-4">{[0, 1].map((i) => <div key={i} className="h-80 animate-pulse rounded-3xl bg-muted" />)}</div>}
      {data && data.length === 0 && (
        <div className="rounded-3xl bg-primary-soft p-8 text-center">
          <p className="font-display text-lg font-semibold">No questions yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Be the first to ask the crowd!</p>
          <Button asChild variant="hero" className="mt-5 h-11 px-6">
            <Link to="/new">Ask a question</Link>
          </Button>
        </div>
      )}
      <div className="space-y-5">
        {data?.map((q) => <QuestionCard key={q.id} q={q} />)}
      </div>
    </AppShell>
  );
}
