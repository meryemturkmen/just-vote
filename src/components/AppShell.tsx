import { Link, useLocation } from "@tanstack/react-router";
import { Bell, Trophy, House, Plus, LayoutGrid, CircleUser } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useUser } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { LegalLinks } from "@/components/LegalPage";

export function AppShell({ children, title, bleed }: { children: ReactNode; title?: string; bleed?: boolean }) {
  const path = useLocation({ select: (l) => l.pathname });
  return (
    <div className={bleed ? "mx-auto h-[100dvh] max-w-md overflow-hidden" : "mx-auto min-h-[100dvh] max-w-md pb-32"}>
      <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-background/70 px-4 pb-2.5 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-xl backdrop-saturate-150 min-[400px]:px-5">
        <div className="flex items-center justify-between">
          <Link to="/" aria-label="Just Vote home" className="press"><Logo /></Link>
          <div className="flex items-center gap-2">
            <Link to="/leaderboard" aria-label="Weekly leaderboard" className="grid size-10 place-items-center rounded-full border border-border bg-white/[0.05] press">
              <Trophy className="size-[18px]" strokeWidth={1.8} />
            </Link>
            <NotificationBell />
          </div>
        </div>
      </header>
      <div key={path} className="animate-page">
        {title && <h1 className="px-4 pt-6 text-[34px] leading-[1.05] min-[400px]:px-5">{title}</h1>}
        <main className={bleed ? "" : "px-4 pt-5 min-[400px]:px-5"}>{children}</main>
        {!bleed && (
          <footer className="mt-12 px-4 text-muted-foreground">
            <LegalLinks />
            <p className="mt-2 text-center text-[11px]">© {new Date().getFullYear()} Just Vote · 16+</p>
          </footer>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

function Tab({ to, label, icon: Icon }: { to: "/" | "/my" | "/profile"; label: string; icon: typeof House }) {
  return (
    <Link
      to={to}
      className="flex flex-1 flex-col items-center gap-1 rounded-full py-2 text-[10.5px] font-medium text-muted-foreground transition-colors"
      activeProps={{ className: "!text-foreground bg-white/[0.08]" }}
      activeOptions={{ exact: true }}
    >
      <Icon className="size-[22px]" strokeWidth={1.8} />
      {label}
    </Link>
  );
}

function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center gap-1 rounded-full p-1.5 glass">
        <Tab to="/" label="Feed" icon={House} />
        <Tab to="/my" label="Mine" icon={LayoutGrid} />
        <Tab to="/profile" label="Me" icon={CircleUser} />
        <Link
          to="/new"
          aria-label="New question"
          className="ml-1 grid size-[52px] shrink-0 place-items-center rounded-full bg-chrome press"
        >
          <Plus className="size-6" strokeWidth={2.2} />
        </Link>
      </div>
    </nav>
  );
}

function NotificationBell() {
  const { user } = useUser();
  const { data: unread = 0 } = useQuery({
    queryKey: ["notifications", "unread", user?.id],
    enabled: !!user,
    refetchInterval: 30000,
    queryFn: async () => {
      await supabase.rpc("sync_ended_notifications");
      const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("read", false);
      return count ?? 0;
    },
  });
  if (!user) return null;
  return (
    <Link to="/notifications" aria-label={unread ? `${unread} new notifications` : "Notifications"} className="relative grid size-10 place-items-center rounded-full border border-border bg-white/[0.05] press">
      <Bell className="size-[18px]" strokeWidth={1.8} />
      {unread > 0 && (
        <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-chrome px-1 text-[10px] font-semibold tabular-nums">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
