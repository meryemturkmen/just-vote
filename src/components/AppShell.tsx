import { Link } from "@tanstack/react-router";
import { Home, Plus, LayoutList, User } from "lucide-react";
import type { ReactNode } from "react";

export function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div className="mx-auto min-h-screen max-w-md bg-background pb-28">
      <header className="sticky top-0 z-20 bg-background/85 px-5 pb-3 pt-5 backdrop-blur">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-xl bg-primary font-display text-sm font-bold text-primary-foreground">
            JV
          </span>
          <span className="font-display text-xl font-bold tracking-tight">Just Vote</span>
        </Link>
        {title && <h1 className="mt-5 text-2xl font-bold">{title}</h1>}
      </header>
      <main className="px-5">{children}</main>
      <BottomNav />
    </div>
  );
}

function Tab({ to, label, icon: Icon }: { to: "/" | "/my" | "/profile"; label: string; icon: typeof Home }) {
  return (
    <Link
      to={to}
      className="flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium text-muted-foreground"
      activeProps={{ className: "text-primary" }}
      activeOptions={{ exact: true }}
    >
      <Icon className="size-5" />
      {label}
    </Link>
  );
}

function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md px-4 pb-4">
      <div className="flex items-center rounded-3xl border bg-card px-2 shadow-card">
        <Tab to="/" label="Feed" icon={Home} />
        <Link
          to="/new"
          aria-label="New question"
          className="-mt-7 mx-2 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-float transition-transform active:scale-95"
        >
          <Plus className="size-7" />
        </Link>
        <Tab to="/my" label="My Questions" icon={LayoutList} />
        <Tab to="/profile" label="Profile" icon={User} />
      </div>
    </nav>
  );
}
