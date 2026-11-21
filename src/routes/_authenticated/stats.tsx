import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { ListSkeleton } from "@/components/Skeleton";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/stats")({
  head: () => ({
    meta: [
      { title: "Stats — Just Vote" },
      { name: "description", content: "Sign-ups, questions, votes, shares and link opens." },
      { property: "og:title", content: "Stats — Just Vote" },
      { property: "og:description", content: "Sign-ups, questions, votes, shares and link opens." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Stats,
});

const METRICS = [
  { key: "signups", label: "Sign-ups", emoji: "🙋", color: "bg-white/[0.12]" },
  { key: "questions", label: "Questions", emoji: "❓", color: "bg-chrome" },
  { key: "votes", label: "Votes", emoji: "🗳️", color: "bg-lime" },
  { key: "shares", label: "Share clicks", emoji: "📤", color: "bg-white/[0.12]" },
  { key: "opens", label: "Link opens", emoji: "🔗", color: "bg-chrome" },
] as const;
type Key = (typeof METRICS)[number]["key"];
type Day = Record<Key, number> & { day: string };
type StatsData = { totals: Record<Key, number>; daily: Day[] };

function Stats() {
  const { user } = Route.useRouteContext();
  const [days, setDays] = useState(14);
  const [metric, setMetric] = useState<Key>("votes");
  const isAdmin = useQuery({
    queryKey: ["is-admin", user.id],
    queryFn: async () => (await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" })).data === true,
  });
  const stats = useQuery({
    queryKey: ["admin-stats", days],
    enabled: isAdmin.data === true,
    refetchInterval: 60000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_stats", { p_days: days });
      if (error) throw error;
      return data as unknown as StatsData;
    },
  });

  if (isAdmin.isLoading) return <AppShell title="Stats"><ListSkeleton /></AppShell>;
  if (!isAdmin.data) {
    return <AppShell title="No access"><p className="font-medium">Admins only. <Link to="/" className="font-extrabold underline">Back to the feed</Link></p></AppShell>;
  }

  const daily = stats.data?.daily ?? [];
  const inRange = (k: Key) => daily.reduce((n, d) => n + Number(d[k] ?? 0), 0);
  const max = Math.max(1, ...daily.map((d) => Number(d[metric] ?? 0)));
  const opens = inRange("opens"), shares = inRange("shares");

  return (
    <AppShell title="Stats">
      <div className="mb-4 grid grid-cols-3 gap-2">
        {[7, 14, 30].map((d) => (
          <Button key={d} variant={days === d ? "hero" : "soft"} className="h-10" onClick={() => setDays(d)}>{d} days</Button>
        ))}
      </div>
      {stats.isLoading && <ListSkeleton rows={3} h="h-24" />}
      {stats.isError && <p className="font-bold text-destructive">Couldn't load stats: {(stats.error as Error).message}</p>}
      {stats.data && (
        <>
          <div className="grid grid-cols-2 gap-3">
            {METRICS.map((m) => (
              <button
                key={m.key}
                onClick={() => setMetric(m.key)}
                className={cn("rounded-2xl p-3 text-left brut press", m.color, metric === m.key && "ring-4 ring-ink")}
              >
                <p className="text-xs font-extrabold uppercase">{m.emoji} {m.label}</p>
                <p className="font-display text-3xl font-extrabold leading-none">{inRange(m.key)}</p>
                <p className="mt-1 text-[11px] font-bold">{stats.data.totals[m.key]} all-time</p>
              </button>
            ))}
            <div className="rounded-2xl bg-card p-3 brut">
              <p className="text-xs font-extrabold uppercase">🔁 Opens / share</p>
              <p className="font-display text-3xl font-extrabold leading-none">{shares ? (opens / shares).toFixed(1) : "–"}</p>
              <p className="mt-1 text-[11px] font-bold">last {days} days</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-card p-4 brut">
            <p className="font-display font-extrabold">{METRICS.find((m) => m.key === metric)?.label} per day</p>
            <div className="mt-3 flex h-40 items-end gap-[3px]" role="img" aria-label={`${metric} per day`}>
              {daily.map((d) => (
                <div key={d.day} className="flex min-w-0 flex-1 flex-col items-center justify-end" title={`${d.day}: ${d[metric]}`}>
                  <div className="w-full rounded-t-sm border border-b-0 bg-chrome" style={{ height: `${(Number(d[metric]) / max) * 100}%`, minHeight: Number(d[metric]) ? 4 : 0 }} />
                </div>
              ))}
            </div>
            <div className="mt-1 flex justify-between border-t-2 pt-1 text-[10px] font-bold">
              <span>{daily[0]?.day.slice(5)}</span><span>today</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Counts only — no names, emails or IPs stored for shares and link opens.</p>
        </>
      )}
    </AppShell>
  );
}
