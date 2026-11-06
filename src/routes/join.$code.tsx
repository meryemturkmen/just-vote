import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { ListSkeleton } from "@/components/Skeleton";
import { useUser } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { joinCrew } from "@/lib/social";

export const Route = createFileRoute("/join/$code")({
  head: () => ({
    meta: [
      { title: "You're invited to a crew — Just Vote" },
      { name: "description", content: "Join a private Just Vote crew and help your friends decide." },
      { property: "og:title", content: "You're invited to a crew on Just Vote" },
      { property: "og:description", content: "Join a private Just Vote crew and help your friends decide." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: JoinCrew,
});

function JoinCrew() {
  const { code } = Route.useParams();
  const { user, loading } = useUser();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["crew-preview", code, user?.id],
    enabled: !loading,
    queryFn: async () => (await supabase.rpc("crew_preview", { p_code: code })).data?.[0] ?? null,
  });

  async function join() {
    setBusy(true);
    try {
      const id = await joinCrew(code);
      qc.invalidateQueries({ queryKey: ["crews"] });
      toast.success("You're in 🫂");
      nav({ to: "/crews/$id", params: { id } });
    } catch (e) {
      toast.error((e as Error).message);
      setBusy(false);
    }
  }

  if (loading || isLoading) return <AppShell><ListSkeleton /></AppShell>;
  if (!data) return (
    <AppShell title="Dead link 💀">
      <p className="text-muted-foreground">This invite doesn't work anymore. Ask your friend for a fresh one.</p>
      <Button asChild variant="hero" className="mt-6 h-12 w-full"><Link to="/">Go to the feed</Link></Button>
    </AppShell>
  );

  return (
    <AppShell>
      <div className="flex flex-col items-center pt-8 text-center">
        <span className="grid size-24 place-items-center rounded-2xl bg-lime text-5xl brut tilt-l animate-pop">{data.emoji}</span>
        <p className="mt-6 text-sm font-bold uppercase">You're invited to</p>
        <h1 className="mt-1 text-3xl">{data.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{data.members} {data.members === 1 ? "member" : "members"} · private questions only they can see</p>
        {data.is_member ? (
          <Button asChild variant="hero" className="mt-8 h-12 w-full"><Link to="/crews/$id" params={{ id: data.id }}>Open crew</Link></Button>
        ) : user ? (
          <Button variant="hero" className="mt-8 h-12 w-full" disabled={busy} onClick={join}>{busy ? "Joining…" : "Join crew"}</Button>
        ) : (
          <>
            <Button asChild variant="hero" className="mt-8 h-12 w-full"><Link to="/auth">Sign in to join</Link></Button>
            <p className="mt-3 text-xs text-muted-foreground">Come back to this link after signing in.</p>
          </>
        )}
      </div>
    </AppShell>
  );
}
