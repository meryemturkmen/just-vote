import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { ListSkeleton } from "@/components/Skeleton";
import { CategoryTag } from "@/components/CategoryChips";
import { supabase } from "@/integrations/supabase/client";
import { displayTitle, fetchQuestion } from "@/lib/questions";
import { adminDeleteQuestion } from "@/lib/moderation.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Reports admin — Just Vote" },
      { name: "description", content: "Review reported questions." },
      { property: "og:title", content: "Reports admin — Just Vote" },
      { property: "og:description", content: "Review reported questions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

type Report = { id: string; question_id: string; reason: string; details: string | null; status: string; created_at: string };

function Admin() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"open" | "done">("open");
  const role = useQuery({
    queryKey: ["is-admin", user.id],
    queryFn: async () => (await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" })).data === true,
  });
  const reports = useQuery({
    queryKey: ["admin-reports", tab],
    enabled: role.data === true,
    queryFn: async () => {
      let q = supabase.from("reports").select("id, question_id, reason, details, status, created_at").order("created_at", { ascending: false }).limit(200);
      q = tab === "open" ? q.eq("status", "open") : q.neq("status", "open");
      const { data, error } = await q;
      if (error) throw error;
      const byQ = new Map<string, Report[]>();
      for (const r of data as Report[]) byQ.set(r.question_id, [...(byQ.get(r.question_id) ?? []), r]);
      const qs = await Promise.all([...byQ.keys()].map((id) => fetchQuestion(id).catch(() => null)));
      return [...byQ.entries()].map(([id, rs], i) => ({ id, reports: rs, q: qs[i] }));
    },
  });

  if (role.isLoading) return <AppShell title="Reports"><ListSkeleton /></AppShell>;
  if (!role.data) {
    return (
      <AppShell title="Nope 🙅">
        <p className="font-medium">Admins only. <Link to="/" className="font-extrabold underline">Back to the feed</Link></p>
      </AppShell>
    );
  }

  return (
    <AppShell title="Reports 🚨">
      <div className="mb-4 grid grid-cols-2 gap-2">
        {(["open", "done"] as const).map((t) => (
          <Button key={t} variant={tab === t ? "hero" : "soft"} className="h-11" onClick={() => setTab(t)}>
            {t === "open" ? "Open" : "Handled"}
          </Button>
        ))}
      </div>
      {reports.isLoading && <ListSkeleton rows={3} h="h-48" />}
      {reports.isError && <p className="font-bold text-destructive">Couldn't load reports. {(reports.error as Error).message}</p>}
      {reports.data?.length === 0 && (
        <div className="tilt-l rounded-2xl bg-lime p-6 text-center brut">
          <p className="font-display text-xl font-extrabold">Inbox zero 🧘</p>
          <p className="text-sm">Nobody's snitching right now.</p>
        </div>
      )}
      <div className="space-y-4">
        {reports.data?.map((g) => (
          <ReportCard key={g.id} group={g} onChange={() => qc.invalidateQueries({ queryKey: ["admin-reports"] })} />
        ))}
      </div>
    </AppShell>
  );
}

function ReportCard({ group, onChange }: { group: { id: string; reports: Report[]; q: Awaited<ReturnType<typeof fetchQuestion>> | null }; onChange: () => void }) {
  const del = useServerFn(adminDeleteQuestion);
  const [busy, setBusy] = useState(false);
  const { q, reports } = group;
  const hidden = (q as { hidden?: boolean } | null)?.hidden ?? false;

  async function run(fn: () => Promise<unknown>, msg: string) {
    setBusy(true);
    try { await fn(); toast.success(msg); onChange(); }
    catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  }
  const markReports = (status: string) =>
    supabase.from("reports").update({ status, reviewed_at: new Date().toISOString() }).eq("question_id", group.id).eq("status", "open").then(({ error }) => { if (error) throw error; });

  return (
    <article className="rounded-2xl bg-card p-4 brut">
      {q ? (
        <>
          <div className="flex items-center justify-between gap-2">
            <CategoryTag category={q.category} />
            {hidden && <span className="rounded-full bg-ink px-2 py-0.5 text-xs font-extrabold text-background">HIDDEN</span>}
          </div>
          <Link to="/q/$id" params={{ id: q.id }} className="mt-2 block font-display text-lg font-extrabold leading-tight underline">{displayTitle(q)}</Link>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[q.option_a_url, q.option_b_url].map((u, i) => (
              <img key={i} src={u} alt={`Option ${i ? "B" : "A"}`} className="aspect-square w-full rounded-xl border-2 object-cover" />
            ))}
          </div>
        </>
      ) : (
        <p className="font-bold">Question already deleted.</p>
      )}
      <ul className="mt-3 space-y-1 text-sm">
        {reports.map((r) => (
          <li key={r.id} className="rounded-lg bg-muted px-2 py-1">
            <b>{r.reason}</b>{r.details ? ` — ${r.details}` : ""} <span className="text-xs text-muted-foreground">· {new Date(r.created_at).toLocaleDateString()} · {r.status}</span>
          </li>
        ))}
      </ul>
      {q && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Button variant="soft" className="h-11 px-2" disabled={busy}
            onClick={() => run(async () => {
              const { error } = await supabase.from("questions").update({ hidden: !hidden }).eq("id", q.id);
              if (error) throw error;
              if (!hidden) await markReports("hidden");
            }, hidden ? "Unhidden" : "Hidden 🙈")}>
            {hidden ? "Unhide" : "Hide"}
          </Button>
          <Button variant="destructive" className="h-11 border-2 px-2" disabled={busy}
            onClick={() => { if (window.confirm("Delete this question and its photos for good?")) run(async () => { await markReports("deleted"); await del({ data: { id: q.id } }); }, "Deleted 🗑️"); }}>
            Delete
          </Button>
          <Button variant="soft" className="h-11 px-2" disabled={busy} onClick={() => run(() => markReports("dismissed"), "Dismissed")}>
            Dismiss
          </Button>
        </div>
      )}
    </article>
  );
}
