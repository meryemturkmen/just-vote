import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { AvatarSticker } from "@/components/Avatar";
import { CategoryTag } from "@/components/CategoryChips";
import { Button } from "@/components/ui/button";
import { ListSkeleton } from "@/components/Skeleton";
import { useUser } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { fetchPublicProfile, setFollow } from "@/lib/social";
import { displayTitle } from "@/lib/questions";

export const Route = createFileRoute("/u/$username")({
  head: ({ params }) => ({
    meta: [
      { title: `@${params.username} — Just Vote` },
      { name: "description", content: `See what @${params.username} votes on in Just Vote.` },
      { property: "og:title", content: `@${params.username} on Just Vote` },
      { property: "og:description", content: `See what @${params.username} votes on in Just Vote.` },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PublicProfilePage,
});

function PublicProfilePage() {
  const { username } = Route.useParams();
  const { user } = useUser();
  const qc = useQueryClient();
  const { data: p, isLoading } = useQuery({ queryKey: ["public-profile", username, user?.id], queryFn: () => fetchPublicProfile(username) });
  const asks = useQuery({
    queryKey: ["public-profile-asks", p?.id],
    enabled: !!p,
    queryFn: async () =>
      (await supabase.from("questions").select("id, title, category").eq("user_id", p!.id).eq("visibility", "public").order("created_at", { ascending: false }).limit(10)).data ?? [],
  });

  async function toggle() {
    if (!user || !p) return;
    try {
      await setFollow(user.id, p.id, !p.i_follow);
      toast.success(p.i_follow ? "Unfollowed. It's not you, it's them." : `Following @${p.username} 👀`);
      qc.invalidateQueries({ queryKey: ["public-profile"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  if (isLoading) return <AppShell><ListSkeleton /></AppShell>;
  if (!p) return (
    <AppShell title="Who? 🤔">
      <p className="text-muted-foreground">No one goes by @{username}.</p>
      <Button asChild variant="hero" className="mt-6 h-12 w-full"><Link to="/">Back to the feed</Link></Button>
    </AppShell>
  );

  const isMe = user?.id === p.id;
  return (
    <AppShell>
      <div className="rounded-2xl bg-pink p-5 brut">
        <div className="flex items-center gap-4">
          <AvatarSticker emoji={p.avatar_emoji} color={p.avatar_color} size="lg" />
          <div className="min-w-0">
            <h1 className="truncate text-2xl">{p.display_name || p.username}</h1>
            <p className="truncate text-sm font-bold">@{p.username}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {p.top_categories.map((c) => <CategoryTag key={c} category={c} />)}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2 text-center">
        <Mini n={p.followers} l="Followers" />
        <Mini n={p.following} l="Following" />
        <Mini n={p.votes} l="Votes" />
        <Mini n={p.week_points} l="Pts / week" />
      </div>
      {isMe ? (
        <Button asChild variant="soft" className="mt-4 h-12 w-full"><Link to="/profile">Edit my profile</Link></Button>
      ) : user ? (
        <Button variant={p.i_follow ? "soft" : "hero"} className="mt-4 h-12 w-full" onClick={toggle}>
          {p.i_follow ? "Following ✓" : "Follow"}
        </Button>
      ) : (
        <Button asChild variant="hero" className="mt-4 h-12 w-full"><Link to="/auth">Sign in to follow</Link></Button>
      )}
      <h2 className="mt-8 text-xl">Their dilemmas</h2>
      <div className="mt-3 space-y-2">
        {asks.data?.length ? asks.data.map((q) => (
          <Link key={q.id} to="/q/$id" params={{ id: q.id }} className="flex items-center justify-between gap-3 rounded-xl bg-card p-3 brut-sm press">
            <span className="truncate font-semibold">{displayTitle(q)}</span>
            <CategoryTag category={q.category} />
          </Link>
        )) : <p className="text-sm text-muted-foreground">Nothing public yet. Mysterious 🕶️</p>}
      </div>
    </AppShell>
  );
}

function Mini({ n, l }: { n: number; l: string }) {
  return (
    <div className="rounded-xl bg-card px-1 py-3 brut-sm">
      <p className="font-display text-xl font-bold">{n}</p>
      <p className="text-[10px] font-bold uppercase text-muted-foreground">{l}</p>
    </div>
  );
}
