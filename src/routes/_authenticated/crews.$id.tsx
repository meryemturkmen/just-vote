import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Share2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { AvatarSticker } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { ListSkeleton } from "@/components/Skeleton";
import { supabase } from "@/integrations/supabase/client";
import { displayTitle, fetchCrewQuestions, isClosed, percent, timeLeft } from "@/lib/questions";
import { inviteUrl } from "@/lib/social";

export const Route = createFileRoute("/_authenticated/crews/$id")({
  head: () => ({
    meta: [
      { title: "Crew — Just Vote" },
      { name: "description", content: "Your private crew's questions on Just Vote." },
      { property: "og:title", content: "Crew — Just Vote" },
      { property: "og:description", content: "Your private crew's questions on Just Vote." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CrewPage,
});

function CrewPage() {
  const { id } = Route.useParams();
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const nav = useNavigate();
  const crew = useQuery({
    queryKey: ["crew", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crews")
        .select("id, name, emoji, owner_id, invite_code, crew_members(user_id, profiles(username, display_name, avatar_emoji, avatar_color))")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const qs = useQuery({ queryKey: ["crew-questions", id], queryFn: () => fetchCrewQuestions(id) });

  async function invite() {
    if (!crew.data) return;
    const url = inviteUrl(crew.data.invite_code);
    const text = `Join my crew "${crew.data.name}" on Just Vote and help me decide 🗳️`;
    if (navigator.share) {
      try { await navigator.share({ title: "Just Vote crew", text, url }); return; } catch (e) { if ((e as Error).name === "AbortError") return; }
    }
    await navigator.clipboard?.writeText(url);
    toast.success("Invite link copied 📋");
  }

  async function resetLink() {
    const { error } = await supabase.rpc("reset_crew_invite", { p_crew: id });
    if (error) { toast.error(error.message); return; }
    toast.success("Old invite link is dead. New one ready 🔁");
    qc.invalidateQueries({ queryKey: ["crew", id] });
  }

  async function leave() {
    if (!window.confirm("Leave this crew? You'll lose access to its questions.")) return;
    const { error } = await supabase.from("crew_members").delete().eq("crew_id", id).eq("user_id", user.id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["crews"] });
    nav({ to: "/crews" });
  }

  if (crew.isLoading) return <AppShell><ListSkeleton /></AppShell>;
  if (!crew.data) return (
    <AppShell title="Crew not found 🤷">
      <p className="text-muted-foreground">You're not in this crew, or it doesn't exist anymore.</p>
      <Button asChild variant="hero" className="mt-6 h-12 w-full"><Link to="/crews">My crews</Link></Button>
    </AppShell>
  );

  const c = crew.data;
  const isOwner = c.owner_id === user.id;
  return (
    <AppShell>
      <div className="flex items-center gap-4 rounded-2xl bg-lime p-5 brut">
        <span className="grid size-16 place-items-center rounded-xl bg-card text-4xl brut-sm tilt-l">{c.emoji}</span>
        <div className="min-w-0">
          <h1 className="truncate text-2xl">{c.name}</h1>
          <p className="text-sm font-bold">{c.crew_members.length} in the crew · private</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="soft" className="h-12" onClick={invite}><Share2 /> Invite</Button>
        <Button asChild variant="hero" className="h-12"><Link to="/new" search={{ crew: id } as never}><Plus /> Ask crew</Link></Button>
      </div>

      <h2 className="mt-8 text-xl">Crew dilemmas</h2>
      <div className="mt-3 space-y-2">
        {qs.isLoading ? <ListSkeleton /> : qs.data?.length ? qs.data.map((q) => {
          const [pa, pb] = percent(q.votesA, q.votesB);
          return (
            <Link key={q.id} to="/q/$id" params={{ id: q.id }} className="flex items-center gap-3 rounded-xl bg-card p-2 brut-sm press">
              <div className="flex shrink-0 gap-1">
                <img src={q.option_a_url} alt="Option A" className="size-12 rounded-lg border-2 object-cover" />
                <img src={q.option_b_url} alt="Option B" className="size-12 rounded-lg border-2 object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{displayTitle(q)}</p>
                <p className="text-xs text-muted-foreground">
                  {q.myVote ? `A ${pa}% · B ${pb}%` : "You haven't voted 👀"} · {isClosed(q) ? "closed" : timeLeft(q.ends_at)}
                </p>
              </div>
            </Link>
          );
        }) : <p className="rounded-xl bg-card p-5 text-center brut-sm">Quiet in here. Drop the first dilemma 🎤</p>}
      </div>

      <h2 className="mt-8 text-xl">Members</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {c.crew_members.map((m) => {
          const p = m.profiles as { username: string | null; display_name: string | null; avatar_emoji: string; avatar_color: string } | null;
          if (!p?.username) return null;
          return (
            <Link key={m.user_id} to="/u/$username" params={{ username: p.username }} className="flex items-center gap-2 rounded-full bg-card py-1 pl-1 pr-3 brut-sm press">
              <AvatarSticker emoji={p.avatar_emoji} color={p.avatar_color} size="sm" />
              <span className="text-sm font-bold">@{p.username}{m.user_id === c.owner_id ? " 👑" : ""}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 space-y-2">
        {isOwner && <Button variant="soft" className="h-11 w-full" onClick={resetLink}>Reset invite link</Button>}
        {!isOwner && <Button variant="destructive" className="h-11 w-full border-2" onClick={leave}>Leave crew</Button>}
      </div>
    </AppShell>
  );
}
