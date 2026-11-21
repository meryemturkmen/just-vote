import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AvatarSticker } from "@/components/Avatar";
import { Chip } from "@/components/CategoryChips";
import { ListSkeleton } from "@/components/Skeleton";
import { useUser } from "@/hooks/use-session";
import { CATEGORIES } from "@/lib/categories";
import { fetchLeaderboard } from "@/lib/social";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Weekly leaderboard — Just Vote" },
      { name: "description", content: "The most helpful voters on Just Vote this week, by category." },
      { property: "og:title", content: "Weekly leaderboard — Just Vote" },
      { property: "og:description", content: "The most helpful voters on Just Vote this week, by category." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Leaderboard,
});


function Leaderboard() {
  const { user } = useUser();
  const [category, setCategory] = useState<string | null>(null);
  const [scope, setScope] = useState<"all" | "following">("all");
  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard", category, scope, user?.id],
    queryFn: () => fetchLeaderboard(category, scope),
  });

  return (
    <AppShell title="Leaderboard">
      <p className="text-sm text-muted-foreground">Most helpful this week — points from votes and reactions on your comments.</p>
      {user && (
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-white/[0.06] p-1">
          {(["all", "following"] as const).map((s) => (
            <button key={s} type="button" onClick={() => setScope(s)} className={cn("rounded-lg py-2 text-sm font-extrabold", scope === s ? "bg-white/[0.16] text-foreground" : "text-muted-foreground")}>
              {s === "all" ? "Everyone" : "People I follow"}
            </button>
          ))}
        </div>
      )}
      <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-2">
        <Chip active={!category} onClick={() => setCategory(null)}>All</Chip>
        {CATEGORIES.map((c) => <Chip key={c} active={category === c} onClick={() => setCategory(c)}>{c}</Chip>)}
      </div>
      <ol className="mt-4 space-y-2">
        {isLoading ? <ListSkeleton /> : data?.length ? data.map((r, i) => (
          <li key={r.user_id}>
            <Link to="/u/$username" params={{ username: r.username }} className={cn("flex items-center gap-3 rounded-2xl p-3 brut-sm press", r.user_id === user?.id ? "bg-white/[0.12]" : "bg-card")}>
              <span className={cn("w-7 text-center font-display text-[17px] font-semibold tabular-nums text-muted-foreground", i < 3 && "text-chrome text-[20px] font-bold")}>{i + 1}</span>
              <AvatarSticker emoji={r.avatar_emoji} color={r.avatar_color} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{r.display_name || r.username}</span>
                <span className="block truncate text-xs text-muted-foreground">@{r.username}</span>
              </span>
              <span className="font-display text-[17px] font-semibold tabular-nums">{r.points}</span>
            </Link>
          </li>
        )) : <p className="rounded-xl bg-card p-5 text-center brut-sm">Nobody’s on the board yet this week.</p>}
      </ol>
    </AppShell>
  );
}
