import { createFileRoute, Link } from "@tanstack/react-router";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { QuestionCard } from "@/components/QuestionCard";
import { Chip } from "@/components/CategoryChips";
import { Button } from "@/components/ui/button";
import { FEED_PAGE, fetchFeedPage, type FeedSort } from "@/lib/questions";
import { fetchInterests } from "@/lib/profile";
import { CATEGORIES } from "@/lib/categories";
import { useUser } from "@/hooks/use-session";
import { cn } from "@/lib/utils";

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
  const { user, loading } = useUser();
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<FeedSort>("new");
  const interests = useQuery({
    queryKey: ["interests", user?.id],
    queryFn: () => fetchInterests(user!.id),
    enabled: !!user,
  });
  const myInterests = user && interests.data && interests.data.length < CATEGORIES.length ? interests.data : null;
  const ready = !loading && (!user || interests.isFetched);

  const feed = useInfiniteQuery({
    queryKey: ["questions", "feed", user?.id ?? "guest", category, sort, myInterests],
    queryFn: ({ pageParam }) => fetchFeedPage({ interests: myInterests, category, sort, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (last, all) => (last.length < FEED_PAGE ? undefined : all.length * FEED_PAGE),
    enabled: ready,
  });
  const items = feed.data?.pages.flat() ?? [];
  const dividerIndex = myInterests && !category ? items.findIndex((i) => !i.matched) : -1;

  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => {
      if (e[0]?.isIntersecting && feed.hasNextPage && !feed.isFetchingNextPage) feed.fetchNextPage();
    }, { rootMargin: "600px" });
    io.observe(el);
    return () => io.disconnect();
  }, [feed.hasNextPage, feed.isFetchingNextPage, feed.fetchNextPage]);

  return (
    <AppShell title="Help someone decide">
      <div className="sticky top-[60px] z-10 -mx-5 bg-background/90 px-5 pb-3 pt-1 backdrop-blur">
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2 [scrollbar-width:none]">
          <Chip active={category === null} onClick={() => setCategory(null)}>{myInterests ? "For you" : "All"}</Chip>
          {CATEGORIES.map((c) => (
            <Chip key={c} active={category === c} onClick={() => setCategory(c)}>{c}</Chip>
          ))}
        </div>
        <div className="inline-flex rounded-full bg-muted p-1 text-sm">
          {(["new", "ending"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSort(s)}
              className={cn("rounded-full px-4 py-1.5 font-medium transition", sort === s ? "bg-card text-foreground shadow-card" : "text-muted-foreground")}
            >
              {s === "new" ? "New" : "Ending soon"}
            </button>
          ))}
        </div>
      </div>

      {(feed.isLoading || !ready) && (
        <div className="mt-2 space-y-4">{[0, 1].map((i) => <div key={i} className="h-80 animate-pulse rounded-3xl bg-muted" />)}</div>
      )}

      {feed.isSuccess && items.length === 0 && (
        <div className="mt-2 rounded-3xl bg-primary-soft p-8 text-center">
          <p className="font-display text-lg font-semibold">You're all caught up ✨</p>
          <p className="mt-1 text-sm text-muted-foreground">No open questions here right now. Got one of your own?</p>
          <Button asChild variant="hero" className="mt-5 h-11 px-6">
            <Link to="/new">Ask a question</Link>
          </Button>
        </div>
      )}

      <div className="mt-2 space-y-5">
        {items.map((q, i) => (
          <div key={q.id}>
            {i === dividerIndex && (
              <div className="mb-5 flex items-center gap-3 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <div className="h-px flex-1 bg-border" /> More from other categories <div className="h-px flex-1 bg-border" />
              </div>
            )}
            <QuestionCard q={q} />
          </div>
        ))}
      </div>
      <div ref={sentinel} className="h-10" />
      {feed.isFetchingNextPage && <div className="h-40 animate-pulse rounded-3xl bg-muted" />}
      {feed.isSuccess && items.length > 0 && !feed.hasNextPage && (
        <p className="py-6 text-center text-xs text-muted-foreground">That's everything for now 🎉</p>
      )}
    </AppShell>
  );
}
