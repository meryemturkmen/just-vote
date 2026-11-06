import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { QuestionCard } from "@/components/QuestionCard";
import { Chip } from "@/components/CategoryChips";
import { Button } from "@/components/ui/button";
import { fetchFeed } from "@/lib/questions";
import { fetchInterests } from "@/lib/profile";
import { CATEGORIES } from "@/lib/categories";
import { useUser } from "@/hooks/use-session";

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
  const { user } = useUser();
  const [filter, setFilter] = useState<string>("foryou");
  const interests = useQuery({
    queryKey: ["interests", user?.id],
    queryFn: () => fetchInterests(user!.id),
    enabled: !!user,
  });
  const effective = !user && filter === "foryou" ? "all" : filter;
  const cats =
    effective === "all" ? undefined : effective === "foryou" ? interests.data : [effective];
  const { data, isLoading } = useQuery({
    queryKey: ["questions", "feed", effective, cats],
    queryFn: () => fetchFeed(cats),
    enabled: effective !== "foryou" || !!interests.data,
  });

  return (
    <AppShell title="Help someone decide">
      <p className="-mt-1 mb-4 text-sm text-muted-foreground">Tap the one you'd rather buy. 💛</p>
      <div className="-mx-5 mb-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
        {user && <Chip active={effective === "foryou"} onClick={() => setFilter("foryou")}>For you</Chip>}
        <Chip active={effective === "all"} onClick={() => setFilter("all")}>All</Chip>
        {CATEGORIES.map((c) => (
          <Chip key={c} active={effective === c} onClick={() => setFilter(c)}>{c}</Chip>
        ))}
      </div>
      {isLoading && <div className="space-y-4">{[0, 1].map((i) => <div key={i} className="h-80 animate-pulse rounded-3xl bg-muted" />)}</div>}
      {data && data.length === 0 && (
        <div className="rounded-3xl bg-primary-soft p-8 text-center">
          <p className="font-display text-lg font-semibold">No questions here yet</p>
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
