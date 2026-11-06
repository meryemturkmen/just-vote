import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { fetchMine, percent } from "@/lib/questions";

export const Route = createFileRoute("/_authenticated/my")({
  head: () => ({
    meta: [
      { title: "My Questions — Just Vote" },
      { name: "description", content: "See how people voted on your questions." },
      { property: "og:title", content: "My Questions — Just Vote" },
      { property: "og:description", content: "See how people voted on your questions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Mine,
});

function Mine() {
  const { user } = Route.useRouteContext();
  const { data, isLoading } = useQuery({ queryKey: ["questions", "mine", user.id], queryFn: () => fetchMine(user.id) });

  return (
    <AppShell title="My Questions">
      {isLoading && <div className="h-24 animate-pulse rounded-3xl bg-muted" />}
      {data?.length === 0 && (
        <div className="rounded-3xl bg-primary-soft p-8 text-center">
          <p className="font-display text-lg font-semibold">Nothing here yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Torn between two things? Ask away.</p>
          <Button asChild variant="hero" className="mt-5 h-11 px-6">
            <Link to="/new">New question</Link>
          </Button>
        </div>
      )}
      <div className="space-y-3">
        {data?.map((q) => {
          const [pa, pb] = percent(q.votesA, q.votesB);
          const total = q.votesA + q.votesB;
          return (
            <Link key={q.id} to="/q/$id" params={{ id: q.id }} className="flex gap-3 rounded-3xl border bg-card p-3 shadow-card">
              <div className="flex shrink-0 gap-1">
                <img src={q.option_a_url} alt="" className="size-16 rounded-xl object-cover" />
                <img src={q.option_b_url} alt="" className="size-16 rounded-xl object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{q.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{total} {total === 1 ? "vote" : "votes"}</p>
                <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-border">
                  {total > 0 && <><div className="bg-primary" style={{ width: `${pa}%` }} /><div className="bg-accent-foreground/30" style={{ width: `${pb}%` }} /></>}
                </div>
                <p className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                  <span className="truncate">{q.option_a_label} {pa}%</span>
                  <span className="truncate">{pb}% {q.option_b_label}</span>
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
