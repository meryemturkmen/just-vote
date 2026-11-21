import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Flag, MessageCircle, Vote } from "lucide-react";
import { ListSkeleton } from "@/components/Skeleton";
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
      {isLoading && <ListSkeleton rows={4} h="h-20" />}
      {data?.length === 0 && (
        <div className="rounded-2xl bg-white/[0.08] p-8 text-center brut">
          <p className="font-display text-lg font-semibold">Nothing new yet</p>
          <p className="mt-1 text-sm text-muted-foreground">We'll ping you when people vote on your stuff.</p>
        </div>
      )}
      <ul className="space-y-2">
        {data?.map((n) => (
          <li key={n.id}>
            <Link to="/q/$id" params={{ id: n.question_id }} className={cn("flex items-center gap-3 rounded-2xl bg-card p-4 brut", !n.read && "bg-white/[0.12]")}>
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-chrome brut-sm">
                {n.kind === "ended" ? <Flag className="size-5" /> : n.kind === "comments" ? <MessageCircle className="size-5" /> : <Vote className="size-5" />}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{n.title}</p>
                <p className="text-xs text-muted-foreground">{notificationText(n)}</p>
              </div>
              {!n.read && <span className="ml-auto shrink-0 size-2 rounded-full bg-chrome" aria-label="Unread"></span>}
            </Link>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
