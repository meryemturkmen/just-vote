import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Camera, ImagePlus, PartyPopper, Share2, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Chip } from "@/components/CategoryChips";
import { supabase } from "@/integrations/supabase/client";
import { BUCKET, shareQuestion } from "@/lib/questions";
import { CATEGORIES, isCategory } from "@/lib/categories";
import { compressImage } from "@/lib/compress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/new")({
  head: () => ({
    meta: [
      { title: "New question — Just Vote" },
      { name: "description", content: "Upload two products and let people vote." },
      { property: "og:title", content: "New question — Just Vote" },
      { property: "og:description", content: "Upload two products and let people vote." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewQuestion,
});

const DURATIONS = [
  { h: 1, label: "1 hour" },
  { h: 24, label: "24 hours" },
  { h: 72, label: "3 days" },
] as const;

type Photo = { blob: Blob; preview: string } | null;

function NewQuestion() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [a, setA] = useState<Photo>(null);
  const [b, setB] = useState<Photo>(null);
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [occasion, setOccasion] = useState("");
  const [budget, setBudget] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [duration, setDuration] = useState<number>(24);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<{ id: string; title: string } | null>(null);

  async function upload(blob: Blob) {
    const path = `${user.id}/${crypto.randomUUID()}.jpg`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: blob.type || "image/jpeg" });
    if (error) throw error;
    return path;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!a || !b) { toast.error("Need both pics, bestie"); return; }
    if (!isCategory(category)) { toast.error("Pick a category first"); return; }
    setBusy(true);
    try {
      const [pa, pb] = await Promise.all([upload(a.blob), upload(b.blob)]);
      const { data, error } = await supabase
        .from("questions")
        .insert({
          user_id: user.id,
          title: title.trim(),
          category,
          occasion: occasion.trim() || null,
          budget: budget.trim() || null,
          visibility: isPublic ? "public" : "link",
          duration_hours: duration,
          option_a_label: "Option A",
          option_a_image: pa,
          option_b_label: "Option B",
          option_b_image: pb,
        })
        .select("id")
        .single();
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["questions"] });
      setCreated({ id: data.id, title: title.trim() || "Which one should I buy?" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    return (
      <AppShell>
        <div className="flex flex-col items-center pt-10 text-center">
          <span className="grid size-20 place-items-center rounded-2xl bg-lime brut animate-pop">
            <PartyPopper className="size-9" />
          </span>
          <h1 className="mt-6 text-2xl font-bold">It's live! 🎉</h1>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            {isPublic ? "Your friends are already voting. Probably. Send it to make sure." : "Link only. Drop it in the group chat 👀"}
          </p>
          <Button variant="hero" className="mt-8 h-12 w-full" onClick={() => shareQuestion(created.id, created.title)}>
            <Share2 /> Share link
          </Button>
          <Button asChild variant="soft" className="mt-3 h-12 w-full">
            <Link to="/q/$id" params={{ id: created.id }}>See it</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Help. I can't pick.">
      <form onSubmit={submit} className="space-y-7">
        <div className="grid grid-cols-2 gap-3">
          <PhotoPicker name="A" photo={a} set={setA} />
          <PhotoPicker name="B" photo={b} set={setB} />
        </div>

        <p className="-mt-3 rounded-2xl bg-muted px-4 py-3 text-xs text-muted-foreground">
          🙏 Please don't upload photos showing other people's faces without permission.
        </p>

        <Section label="Category" required>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Chip key={c} active={category === c} onClick={() => setCategory(c)}>{c}</Chip>
            ))}
          </div>
        </Section>

        <Section label="Title" hint="optional">
          <Input className="h-12 rounded-2xl" placeholder='"Which one for the wedding?"' value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
        </Section>

        <div className="grid grid-cols-2 gap-3">
          <Section label="Occasion" hint="optional">
            <Input className="h-12 rounded-2xl" placeholder="e.g. Wedding" value={occasion} onChange={(e) => setOccasion(e.target.value)} maxLength={40} />
          </Section>
          <Section label="Budget" hint="optional">
            <Input className="h-12 rounded-2xl" placeholder="e.g. up to €150" value={budget} onChange={(e) => setBudget(e.target.value)} maxLength={30} />
          </Section>
        </div>

        <Section label="Voting duration">
          <div className="grid grid-cols-3 gap-2 rounded-xl bg-card p-1 brut-sm">
            {DURATIONS.map((d) => (
              <button
                key={d.h}
                type="button"
                onClick={() => setDuration(d.h)}
                className={cn("rounded-full py-2.5 text-sm font-medium transition", duration === d.h ? "bg-ink text-background" : "text-muted-foreground")}
              >
                {d.label}
              </button>
            ))}
          </div>
        </Section>

        <label className="flex items-center justify-between gap-4 rounded-2xl bg-card p-4 brut">
          <div>
            <p className="text-sm font-semibold">{isPublic ? "Show in public feed" : "Link only"}</p>
            <p className="text-xs text-muted-foreground">
              {isPublic ? "The whole internet can vote." : "Only people with the link. Lowkey mode."}
            </p>
          </div>
          <Switch checked={isPublic} onCheckedChange={setIsPublic} aria-label="Show in public feed" />
        </label>

        <Button type="submit" variant="hero" disabled={busy} className="h-12 w-full">
          {busy ? "Posting…" : "Let them judge"}
        </Button>
      </form>
    </AppShell>
  );
}

function Section({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold">
        {label} {required && <span className="text-foreground">*</span>}
        {hint && <span className="font-normal text-muted-foreground"> · {hint}</span>}
      </p>
      {children}
    </div>
  );
}

function PhotoPicker({ name, photo, set }: { name: string; photo: Photo; set: (p: Photo) => void }) {
  const [working, setWorking] = useState(false);
  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setWorking(true);
    try {
      const blob = await compressImage(f);
      set({ blob, preview: URL.createObjectURL(blob) });
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-dashed bg-card shadow-brut">
      <div className="aspect-[3/4]">
        {photo ? (
          <>
            <img src={photo.preview} alt={`Option ${name}`} className="size-full object-cover" />
            <button type="button" aria-label={`Remove photo ${name}`} onClick={() => set(null)} className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-card/90 text-foreground">
              <X className="size-4" />
            </button>
            <span className="absolute left-2 top-2 grid size-8 place-items-center rounded-full bg-primary font-display font-bold text-foreground">{name}</span>
          </>
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-3 p-3">
            <span className="font-display text-3xl font-bold text-foreground">{name}</span>
            {working ? (
              <p className="text-xs text-muted-foreground">Shrinking…</p>
            ) : (
              <div className="flex w-full flex-col gap-2">
                <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-full bg-card py-2 text-xs font-semibold">
                  <Camera className="size-4 text-foreground" /> Camera
                  <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={onFile} aria-label={`Take photo ${name}`} />
                </label>
                <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-full bg-card py-2 text-xs font-semibold">
                  <ImagePlus className="size-4 text-foreground" /> Gallery
                  <input type="file" accept="image/*" className="sr-only" onChange={onFile} aria-label={`Choose photo ${name}`} />
                </label>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
