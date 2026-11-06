import { Link, useLocation } from "@tanstack/react-router";
import { Bell, Flame, Plus, LayoutGrid, Smile } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useUser } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { LegalLinks } from "@/components/LegalPage";

export function AppShell({ children, title, bleed }: { children: ReactNode; title?: string; bleed?: boolean }) {
  const path = useLocation({ select: (l) => l.pathname });
  return (
    <div className={bleed ? "mx-auto h-[100dvh] max-w-md overflow-hidden bg-background" : "mx-auto min-h-[100dvh] max-w-md bg-background pb-32"}>
      <header className="sticky top-0 z-20 border-b-2 bg-background px-4 py-3 min-[400px]:px-5">
        <div className="flex items-center justify-between">
          <Link to="/" aria-label="Just Vote home"><Logo /></Link>
          <NotificationBell />
        </div>
      </header>
      <div key={path} className="animate-page">
        {title && <h1 className="px-4 pt-6 text-[2rem] leading-[0.95] min-[400px]:px-5 min-[400px]:text-4xl">{title}</h1>}
        <main className={bleed ? "" : "px-4 pt-5 min-[400px]:px-5"}>{children}</main>
        {!bleed && (
          <footer className="mt-10 px-4 text-muted-foreground">
            <LegalLinks />
            <p className="mt-2 text-center text-[11px]">© {new Date().getFullYear()} Just Vote · 16+</p>
          </footer>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

function Tab({ to, label, icon: Icon }: { to: "/" | "/my" | "/profile"; label: string; icon: typeof Flame }) {
  return (
    <Link
      to={to}
      className="flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-extrabold uppercase"
      activeProps={{ className: "bg-yellow" }}
      activeOptions={{ exact: true }}
    >
      <Icon className="size-6" strokeWidth={2.75} />
      {label}
    </Link>
  );
}

function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md px-3 pb-3">
      <div className="flex items-center gap-1 rounded-2xl bg-card p-1.5 brut">
        <Tab to="/" label="Feed" icon={Flame} />
        <Link
          to="/new"
          aria-label="New question"
          className="mx-1 -mt-8 grid size-16 rotate-[-6deg] place-items-center rounded-2xl bg-primary brut press"
        >
          <Plus className="size-9" strokeWidth={3.5} />
        </Link>
        <Tab to="/my" label="Mine" icon={LayoutGrid} />
        <Tab to="/profile" label="Me" icon={Smile} />
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
    <Link to="/notifications" aria-label={unread ? `${unread} new notifications` : "Notifications"} className="relative grid size-11 place-items-center rounded-xl bg-card brut-sm press">
      <Bell className="size-5" strokeWidth={2.75} />
      {unread > 0 && (
        <span className="animate-wiggle absolute -right-2 -top-2 grid min-w-6 place-items-center rounded-full bg-primary px-1 text-[11px] font-extrabold brut-sm">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
