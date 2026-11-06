import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListSkeleton } from "@/components/Skeleton";
import { createCrew, fetchMyCrews } from "@/lib/social";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/crews")({
  head: () => ({
    meta: [
      { title: "Your crews — Just Vote" },
      { name: "description", content: "Private groups where only your crew sees and votes on your questions." },
      { property: "og:title", content: "Your crews — Just Vote" },
      { property: "og:description", content: "Private groups where only your crew sees and votes on your questions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Crews,
});

const CREW_EMOJIS = ["🫂", "👯", "🏀", "🎮", "💄", "🏠", "🍜", "🎓"];

function Crews() {
  const nav = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ["crews"], queryFn: fetchMyCrews });
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(CREW_EMOJIS[0]);
  const [busy, setBusy] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const id = await createCrew(name, emoji);
      toast.success("Crew created. Now invite the gang 📨");
      nav({ to: "/crews/$id", params: { id } });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title="Your crews 🫂">
      <p className="text-sm text-muted-foreground">Private groups. Questions posted to a crew are only visible to its members.</p>
      <div className="mt-5 space-y-2">
        {isLoading ? <ListSkeleton /> : data?.length ? data.map((c) => (
          <Link key={c.id} to="/crews/$id" params={{ id: c.id }} className="flex items-center gap-3 rounded-xl bg-card p-3 brut-sm press">
            <span className="grid size-11 place-items-center rounded-lg bg-lime text-2xl brut-sm tilt-r">{c.emoji}</span>
            <span className="min-w-0 flex-1 truncate font-display text-lg font-bold">{c.name}</span>
            <span className="text-xs font-bold text-muted-foreground">{c.members} {c.members === 1 ? "member" : "members"}</span>
          </Link>
        )) : <p className="rounded-xl bg-card p-5 text-center brut-sm">No crew yet. Squad up 👇</p>}
      </div>
      <form onSubmit={create} className="mt-8 rounded-2xl bg-yellow p-4 brut">
        <p className="font-display text-lg font-bold">Start a crew</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {CREW_EMOJIS.map((e) => (
            <button key={e} type="button" onClick={() => setEmoji(e)} aria-pressed={emoji === e} className={cn("grid size-10 place-items-center rounded-lg text-xl brut-sm", emoji === e ? "bg-pink" : "bg-card")}>{e}</button>
          ))}
        </div>
        <Input className="mt-3 h-12 rounded-xl bg-card" placeholder="e.g. Besties, Flatmates" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
        <Button type="submit" variant="hero" disabled={busy || !name.trim()} className="mt-3 h-12 w-full">{busy ? "Creating…" : "Create crew"}</Button>
      </form>
    </AppShell>
  );
}
