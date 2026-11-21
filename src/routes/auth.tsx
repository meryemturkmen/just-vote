import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Just Vote" },
      { name: "description", content: "Sign in to Just Vote to ask and vote." },
      { property: "og:title", content: "Sign in — Just Vote" },
      { property: "og:description", content: "Sign in to Just Vote to ask and vote." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [age, setAge] = useState(false);
  const [trap, setTrap] = useState("");
  const [openedAt] = useState(() => Date.now());

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "up") {
        // Basic bot protection: hidden honeypot field + humans need > 3s to fill the form
        if (trap || Date.now() - openedAt < 3000) { toast.error("That was fast. Please try again in a moment."); return; }
        if (!age) { toast.error("You need to be 16 or older to join."); return; }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: name, age_confirmed_16: true, age_confirmed_at: new Date().toISOString() } },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Check your inbox to confirm your email.");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      nav({ to: "/" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    if (mode === "up" && !age) { toast.error("Please confirm you're 16 or older first."); return; }
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) { toast.error(r.error.message); return; }
    if (r.redirected) return;
    nav({ to: "/" });
  }

  return (
    <AppShell title={mode === "in" ? "Welcome back" : "Create account"}>
      <p className="-mt-0.5 mb-7 text-[17px] text-muted-foreground">
        {mode === "in" ? "Sign in to ask questions and earn points." : "It takes about ten seconds."}
      </p>
      <button
        type="button"
        onClick={google}
        className="flex h-12 w-full items-center justify-center gap-[10px] rounded-full bg-white px-3 text-[15px] font-semibold text-[#1F1F1F] press"
      >
        <svg aria-hidden="true" width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
        Continue with Google
      </button>
      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
      </div>
      <form onSubmit={submit} className="space-y-3">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={trap} onChange={(e) => setTrap(e.target.value)} className="absolute -left-[9999px] h-0 w-0 opacity-0" />
        {mode === "up" && (
          <Input className="h-12" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
        )}
        <Input className="h-12" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input className="h-12" type="password" placeholder="Password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
        {mode === "up" && (
          <label className="flex items-start gap-3 rounded-2xl border border-border bg-white/[0.04] p-3.5 text-[14px] text-muted-foreground">
            <input type="checkbox" checked={age} onChange={(e) => setAge(e.target.checked)} required className="mt-0.5 size-5 shrink-0 accent-[#d9d9d9]" />
            <span>I'm at least 16 years old and accept the <Link to="/terms" className="font-medium text-foreground underline">Terms</Link> and <Link to="/privacy" className="font-medium text-foreground underline">Privacy Policy</Link>.</span>
          </label>
        )}
        <Button type="submit" variant="hero" disabled={busy} className="h-12 w-full">
          {mode === "in" ? "Sign in" : "Create account"}
        </Button>
      </form>
      <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-6 w-full text-center text-[15px] text-muted-foreground">
        {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
      </button>
    </AppShell>
  );
}
