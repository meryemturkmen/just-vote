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
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => {
      if (e[0]?.isIntersecting && feed.hasNextPage && !feed.isFetchingNextPage) feed.fetchNextPage();
    }, { root: scroller.current, rootMargin: "0px 0px 1500px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [feed.hasNextPage, feed.isFetchingNextPage, feed.fetchNextPage]);

  return (
    <AppShell bleed>
      <div className="flex h-[calc(100dvh-70px)] flex-col">
        <div className="border-b-2 bg-background px-4 py-2.5">
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 pt-0.5">
            <SortToggle sort={sort} setSort={setSort} />
            <Chip active={category === null} onClick={() => setCategory(null)}>{myInterests ? "For you ✨" : "All"}</Chip>
            {CATEGORIES.map((c) => (
              <Chip key={c} active={category === c} onClick={() => setCategory(c)}>{c}</Chip>
            ))}
          </div>
        </div>

        <div className="no-scrollbar relative min-h-0 flex-1 snap-y snap-mandatory overflow-y-scroll mb-[92px]" ref={scroller}>
          {(feed.isLoading || !ready) && (
            <div className="flex h-full items-center justify-center">
              <p className="animate-wiggle rounded-lg bg-yellow px-4 py-2 font-display text-xl font-extrabold brut">Loading the drama…</p>
            </div>
          )}

          {feed.isSuccess && items.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
              <p className="tilt-l rounded-lg bg-lime px-4 py-2 font-display text-3xl font-extrabold brut">All caught up 🫡</p>
              <p className="font-medium">No open questions here rn. Got your own dilemma?</p>
              <Button asChild variant="hero" size="xl"><Link to="/new">Ask the internet</Link></Button>
            </div>
          )}

          {items.map((q, i) => (
            <div key={q.id} className="contents">
              {i === dividerIndex && (
                <section className="flex h-full snap-start snap-always flex-col items-center justify-center gap-3 px-8 text-center">
                  <p className="tilt-r rounded-lg bg-primary px-4 py-3 font-display text-3xl font-extrabold leading-tight brut">More from other categories</p>
                  <p className="font-medium">You've seen your faves. Time to judge other stuff 👇</p>
                </section>
              )}
              <QuestionCard q={q} />
            </div>
          ))}

          {feed.isSuccess && items.length > 0 && !feed.hasNextPage && (
            <section className="flex h-full snap-start flex-col items-center justify-center gap-4 px-8 text-center">
              <p className="tilt-l rounded-lg bg-lime px-4 py-3 font-display text-3xl font-extrabold brut">That's all, folks 🎉</p>
              <p className="font-medium">You voted on everything. Touch grass or ask your own.</p>
              <Button asChild variant="hero" size="xl"><Link to="/new">Ask a question</Link></Button>
            </section>
          )}
          <div ref={sentinel} className="h-px" />
        </div>
      </div>
    </AppShell>
  );
}

function SortToggle({ sort, setSort }: { sort: FeedSort; setSort: (s: FeedSort) => void }) {
  return (
    <button
      type="button"
      onClick={() => setSort(sort === "new" ? "ending" : "new")}
      className="shrink-0 rounded-full bg-yellow px-4 py-2 text-sm font-extrabold brut-sm press"
      aria-label={`Sort: ${sort === "new" ? "New" : "Ending soon"}`}
    >
      {sort === "new" ? "🆕 New" : "⏰ Ending soon"}
    </button>
  );
}
