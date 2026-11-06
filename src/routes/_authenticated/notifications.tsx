import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Flag, Vote } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { fetchNotifications, markAllRead, notificationText } from "@/lib/notifications";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Just Vote" },
      { name: "description", content: "New votes and finished questions." },
      { property: "og:title", content: "Notifications — Just Vote" },
      { property: "og:description", content: "New votes and finished questions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Notifications,
});

function Notifications() {
  const qc = useQueryClient();
  const { data, isLoading, isSuccess } = useQuery({ queryKey: ["notifications"], queryFn: fetchNotifications });
  useEffect(() => {
    if (isSuccess && data.some((n) => !n.read)) {
      markAllRead().then(() => qc.invalidateQueries({ queryKey: ["notifications", "unread"] }));
    }
  }, [isSuccess, data, qc]);

  return (
    <AppShell title="Notifications">
      {isLoading && <div className="h-20 animate-pulse rounded-3xl bg-muted" />}
      {data?.length === 0 && (
        <div className="rounded-3xl bg-primary-soft p-8 text-center">
          <p className="font-display text-lg font-semibold">All quiet 🌿</p>
          <p className="mt-1 text-sm text-muted-foreground">We'll let you know when people vote on your questions.</p>
        </div>
      )}
      <ul className="space-y-2">
        {data?.map((n) => (
          <li key={n.id}>
            <Link to="/q/$id" params={{ id: n.question_id }} className={cn("flex items-center gap-3 rounded-3xl border bg-card p-4 shadow-card", !n.read && "border-primary/40 bg-primary-soft")}>
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                {n.kind === "ended" ? <Flag className="size-5" /> : <Vote className="size-5" />}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{n.title}</p>
                <p className="text-xs text-muted-foreground">{notificationText(n)}</p>
              </div>
              {!n.read && <span className="ml-auto size-2 shrink-0 rounded-full bg-primary" />}
            </Link>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
