import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <AppShell title={title}>
      <p className="mb-5 text-[13px] text-muted-foreground">Last updated: {updated}</p>
      <article className="space-y-4 rounded-3xl bg-card p-5 text-[15px] leading-relaxed text-foreground/85 brut [&_h2]:mt-2 [&_h2]:text-[20px] [&_h2]:text-foreground [&_a]:font-semibold [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </article>
    </AppShell>
  );
}

/** Small legal links row used in the footer and profile. */
export function LegalLinks({ className = "" }: { className?: string }) {
  return (
    <nav className={`flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs ${className}`} aria-label="Legal">
      <Link to="/privacy" className="underline underline-offset-2">Privacy</Link>
      <Link to="/terms" className="underline underline-offset-2">Terms</Link>
      <Link to="/imprint" className="underline underline-offset-2">Imprint</Link>
    </nav>
  );
}
