import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { InterestPicker } from "@/components/InterestPicker";
import { CATEGORIES } from "@/lib/categories";
import { fetchInterests, saveInterests } from "@/lib/profile";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Pick your interests — Just Vote" },
      { name: "description", content: "Choose the categories you want to vote on." },
      { property: "og:title", content: "Pick your interests — Just Vote" },
      { property: "og:description", content: "Choose the categories you want to vote on." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const { user } = Route.useRouteContext();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [interests, setInterests] = useState<string[]>([...CATEGORIES]);
  const [busy, setBusy] = useState(false);
  useEffect(() => { fetchInterests(user.id).then(setInterests); }, [user.id]);

  async function done() {
    setBusy(true);
    try {
      await saveInterests(user.id, interests);
      qc.invalidateQueries();
      nav({ to: "/" });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 pb-8 pt-10">
      <span className="grid size-10 place-items-center rounded-xl bg-primary font-display font-bold text-primary-foreground">JV</span>
      <h1 className="mt-6 text-3xl font-bold">What do you like shopping for?</h1>
      <p className="mt-2 text-sm text-muted-foreground">We'll show you questions from these categories. You can change this anytime in your profile.</p>
      <div className="mt-8 flex-1">
        <InterestPicker value={interests} onChange={setInterests} />
      </div>
      <Button variant="hero" className="mt-8 h-12 w-full" disabled={busy} onClick={done}>
        Let's go
      </Button>
    </div>
  );
}
