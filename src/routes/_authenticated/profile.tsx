import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { InterestPicker } from "@/components/InterestPicker";
import { saveInterests } from "@/lib/profile";
import { CATEGORIES } from "@/lib/categories";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Just Vote" },
      { name: "description", content: "Your Just Vote profile." },
      { property: "og:title", content: "Profile — Just Vote" },
      { property: "og:description", content: "Your Just Vote profile." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const nav = useNavigate();
  const { data } = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => {
      const [p, q, v] = await Promise.all([
        supabase.from("profiles").select("display_name, interests").eq("id", user.id).maybeSingle(),
        supabase.from("questions").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("votes").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);
      return { name: p.data?.display_name ?? "", interests: p.data?.interests ?? [...CATEGORIES], questions: q.count ?? 0, votes: v.count ?? 0 };
    },
  });
  const [name, setName] = useState("");
  const [interests, setInterests] = useState<string[]>([...CATEGORIES]);
  useEffect(() => { if (data) { setName(data.name); setInterests(data.interests); } }, [data]);

  async function saveCats() {
    try {
      await saveInterests(user.id, interests);
      toast.success("Interests saved!");
      qc.invalidateQueries();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function save() {
    const { error } = await supabase.from("profiles").update({ display_name: name.trim() }).eq("id", user.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved!");
    qc.invalidateQueries();
  }

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    nav({ to: "/auth", replace: true });
  }

  return (
    <AppShell title="Profile">
      <div className="flex items-center gap-4 rounded-3xl bg-primary-soft p-5">
        <span className="grid size-16 place-items-center rounded-full bg-primary font-display text-2xl font-bold text-primary-foreground">
          {(name || user.email || "?").charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-semibold">{name || "Hi there!"}</p>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stat n={data?.questions ?? 0} label="Questions asked" />
        <Stat n={data?.votes ?? 0} label="Votes cast" />
      </div>
      <div className="mt-6 rounded-3xl border bg-card p-4 shadow-card">
        <p className="mb-3 font-display font-semibold">Your interests</p>
        <InterestPicker value={interests} onChange={setInterests} />
        <Button variant="hero" className="mt-4 h-11 w-full" onClick={saveCats}>Save interests</Button>
      </div>
      <div className="mt-6 space-y-3">
        <label className="text-sm font-medium">Display name</label>
        <Input className="h-12 rounded-2xl" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
        <Button variant="hero" className="h-12 w-full" onClick={save}>Save</Button>
        <Button variant="soft" className="h-12 w-full" onClick={signOut}>Sign out</Button>
      </div>
    </AppShell>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="rounded-3xl border bg-card p-4 shadow-card">
      <p className="font-display text-3xl font-bold text-primary">{n}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
