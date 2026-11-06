import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { CategoryTag } from "@/components/CategoryChips";
import { ListSkeleton } from "@/components/Skeleton";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import {
  BOOST_COST, boostQuestion, isBoosted, decideQuestion, decisionLabel, displayTitle, fetchMine, isClosed, OPTION_COLORS, timeLeft, totals, type Choice, type Question,
} from "@/lib/questions";
import { cn } from "@/lib/utils";

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
  const { data, isLoading } = useQuery({
    queryKey: ["questions", "mine", user.id],
    queryFn: () => fetchMine(user.id),
    refetchInterval: 15000,
  });
  const [deciding, setDeciding] = useState<Question | null>(null);

  return (
    <AppShell title="My dilemmas">
      {isLoading && <ListSkeleton rows={3} h="h-40" />}
      {data?.length === 0 && (
        <div className="rounded-2xl bg-yellow p-8 text-center brut tilt-l">
          <p className="font-display text-lg font-semibold">No dilemmas yet. Suspiciously decisive 🤨</p>
          <p className="mt-1 text-sm text-muted-foreground">Nothing to judge yet. Be the first to ask.</p>
          <Button asChild variant="hero" className="mt-5 h-11 px-6">
            <Link to="/new">New question</Link>
          </Button>
        </div>
      )}
      <div className="space-y-4">
        {data?.map((q) => <MyCard key={q.id} q={q} onDecide={() => setDeciding(q)} />)}
      </div>
      <DecideSheet q={deciding} onClose={() => setDeciding(null)} />
    </AppShell>
  );
}

function MyCard({ q, onDecide }: { q: Question; onDecide: () => void }) {
  const { total } = totals(q);
  const closed = isClosed(q);
  const decided = decisionLabel(q.decided_choice, q.kind);
  return (
    <article className="rounded-2xl bg-card p-4 brut">
      <div className="flex items-center gap-2">
        <CategoryTag category={q.category} />
        {!closed && <span className="flex items-center gap-1 text-[11px] font-semibold text-foreground"><span className="size-1.5 animate-pulse rounded-full bg-primary" /> Live</span>}
        <span className="ml-auto text-[11px] font-medium text-muted-foreground">{decided ?? timeLeft(q.ends_at)}</span>
      </div>
      <Link to="/q/$id" params={{ id: q.id }} className="mt-2 block font-display text-xl font-extrabold leading-tight">
        {displayTitle(q)}
      </Link>
      <div className={cn("mt-3 grid gap-3", q.options.length === 3 ? "grid-cols-3" : "grid-cols-2")}>
        {q.options.map(({ key: c, pct, url: rawUrl, label }) => {
          const url = q.kind === "buyskip" ? q.options[0].url : rawUrl;
          const chosen = q.decided_choice === c;
          return (
            <div key={c} className={cn("overflow-hidden rounded-xl bg-card brut-sm", chosen && "ring-4 ring-primary ring-offset-2")}>
              <div className="relative aspect-square">
                {url && <img src={url} alt={`Option ${c.toUpperCase()}`} className="size-full object-cover" />}
                <span className={cn("absolute left-2 top-2 grid h-7 min-w-7 place-items-center rounded-md px-1.5 text-xs font-extrabold brut-sm", OPTION_COLORS[c])}>{label}</span>
                {chosen && <CheckCircle2 className="absolute right-2 top-2 size-7 rounded-full bg-lime text-foreground" />}
              </div>
              <div className="p-2.5">
                <div className="h-3 overflow-hidden rounded-full border-2 bg-card">
                  <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1 text-sm font-semibold">{pct}%</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">{total} {total === 1 ? "vote" : "votes"} · 💬 {q.commentCount}</p>
        {q.decided_choice ? (
          <Button asChild variant="soft" className="h-9 px-4 text-xs"><Link to="/q/$id" params={{ id: q.id }}>Final results</Link></Button>
        ) : (
          <div className="flex gap-2">
            {!closed && q.visibility === "public" && <BoostButton q={q} />}
            {closed && <Button asChild variant="soft" className="h-9 px-4 text-xs"><Link to="/q/$id" params={{ id: q.id }}>Final results</Link></Button>}
            <Button variant="hero" className="h-9 px-4 text-xs" onClick={onDecide}>I've decided</Button>
          </div>
        )}
      </div>
    </article>
  );
}

function DecideSheet({ q, onClose }: { q: Question | null; onClose: () => void }) {
  const qc = useQueryClient();
  const decide = useMutation({
    mutationFn: (c: Choice | "neither") => decideQuestion(q!.id, c),
    onSuccess: () => {
      toast.success("Congrats on the new buy 🛍️");
      qc.invalidateQueries({ queryKey: ["questions"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Drawer open={!!q} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="font-display text-xl">So… what did you get? 👀</DrawerTitle>
          <DrawerDescription>This ends voting and tells everyone your pick.</DrawerDescription>
        </DrawerHeader>
        {q && (
          <div className="px-4 pb-6">
            {q.kind === "buyskip" ? (
              <div className="grid grid-cols-2 gap-3">
                <Button variant="hero" className="h-14" disabled={decide.isPending} onClick={() => decide.mutate("a")}>🛒 I bought it</Button>
                <Button variant="soft" className="h-14" disabled={decide.isPending} onClick={() => decide.mutate("b")}>🙅 I skipped it</Button>
              </div>
            ) : (
            <div className="grid grid-cols-2 gap-3">
              {q.options.map(({ key: c, url }) => (
                <button
                  key={c}
                  type="button"
                  disabled={decide.isPending}
                  onClick={() => decide.mutate(c)}
                  className="relative overflow-hidden rounded-xl bg-muted brut press"
                >
                  <img src={url} alt={`Option ${c.toUpperCase()}`} className="aspect-square w-full object-cover" />
                  <span className={cn("absolute left-2 top-2 grid size-8 place-items-center rounded-md font-extrabold brut-sm", OPTION_COLORS[c])}>{c.toUpperCase()}</span>
                </button>
              ))}
            </div>
            )}
            <Button variant="ghost" className="mt-3 h-11 w-full" disabled={decide.isPending} onClick={() => decide.mutate("neither")}>
              Neither. Back to scrolling 🫠
            </Button>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}

function BoostButton({ q }: { q: Question }) {
  const qc = useQueryClient();
  const boost = useMutation({
    mutationFn: () => boostQuestion(q.id),
    onSuccess: () => {
      toast.success("Boosted! 24h of main character energy 🚀");
      qc.invalidateQueries({ queryKey: ["questions"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  if (isBoosted(q)) return <span className="self-center text-xs font-semibold text-foreground">🚀 Boosted</span>;
  return (
    <Button variant="soft" className="h-9 px-3 text-xs" disabled={boost.isPending} onClick={() => boost.mutate()}>
      🚀 Boost · {BOOST_COST} pts
    </Button>
  );
}
