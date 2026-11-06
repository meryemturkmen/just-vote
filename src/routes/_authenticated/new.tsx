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
import { QUESTION_KINDS, shareQuestion, type QuestionKind } from "@/lib/questions";
import { useServerFn } from "@tanstack/react-start";
import { uploadQuestionPhotos, uploadPreviewImage } from "@/lib/moderation.functions";
import { hasProfanity, PROFANITY_MSG, friendlyDbError } from "@/lib/profanity";
import { CATEGORIES, isCategory } from "@/lib/categories";
import { compressImage } from "@/lib/compress";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { fetchMyCrews } from "@/lib/social";

export const Route = createFileRoute("/_authenticated/new")({
  head: () => ({
    meta: [
      { title: "New question — Just Vote" },
      { name: "description", content: "Upload two, three or four products — or one to buy or skip — and let people vote." },
      { property: "og:title", content: "New question — Just Vote" },
      { property: "og:description", content: "Upload two products and let people vote." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { crew?: string } => (typeof s["crew"] === "string" ? { crew: s["crew"] } : {}),
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
  const [kind, setKind] = useState<QuestionKind>("ab");
  const [photos, setPhotos] = useState<Photo[]>([null, null, null, null]);
  const spec = QUESTION_KINDS.find((k) => k.value === kind)!;
  const slots = kind === "multi" ? Math.min(4, Math.max(3, photos.slice(0, 4).filter(Boolean).length + 1)) : spec.max;
  const setPhoto = (i: number) => (p: Photo) => setPhotos((cur) => cur.map((x, j) => (j === i ? p : x)));
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [occasion, setOccasion] = useState("");
  const [budget, setBudget] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const search = Route.useSearch();
  const [crewId, setCrewId] = useState<string | null>(search.crew ?? null);
  const crews = useQuery({ queryKey: ["crews"], queryFn: fetchMyCrews });
  const visibility = crewId ? "crew" : isPublic ? "public" : "link";
  const [duration, setDuration] = useState<number>(24);
  const [busy, setBusy] = useState(false);
  const uploadPhotos = useServerFn(uploadQuestionPhotos);
  const uploadPreview = useServerFn(uploadPreviewImage);
  const [created, setCreated] = useState<{ id: string; title: string } | null>(null);

  async function toB64(blob: Blob) {
    const buf = new Uint8Array(await blob.arrayBuffer());
    let bin = "";
    for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
    return btoa(bin);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const picked = photos.slice(0, spec.max).filter((p): p is NonNullable<Photo> => !!p);
    if (picked.length < spec.min) {
      toast.error(kind === "buyskip" ? "Drop a pic first, bestie" : kind === "ab" ? "Need both pics, bestie" : "Need at least 3 pics, bestie");
      return;
    }
    if (!isCategory(category)) { toast.error("Pick a category first"); return; }
    if ([title, occasion, budget].some(hasProfanity)) { toast.error(PROFANITY_MSG); return; }
    setBusy(true);
    try {
      const up = await uploadPhotos({ data: { images: await Promise.all(picked.map((p) => toB64(p.blob))) } });
      if (!up.ok) {
        toast.error(
          up.error === "limit" ? "That's 10 questions today. Chill till tomorrow 😮‍💨"
          : up.error === "blocked" ? "Nope 🚫 Those pics look NSFW or violent. Products only, please."
          : "Our safety check is napping. Try again in a sec.",
        );
        return;
      }
      const paths = up.paths;
      if (paths.length !== picked.length) throw new Error("Upload failed");
      const { data, error } = await supabase
        .from("questions")
        .insert({
          user_id: user.id,
          title: title.trim(),
          category,
          occasion: occasion.trim() || null,
          budget: budget.trim() || null,
          visibility,
          crew_id: crewId,
          duration_hours: duration,
          kind,
          option_a_label: kind === "buyskip" ? "Buy it" : "Option A",
          option_a_image: paths[0],
          option_b_label: kind === "buyskip" ? "Skip it" : "Option B",
          option_b_image: kind === "buyskip" ? paths[0] : paths[1],
          option_c_image: kind === "multi" ? paths[2] : null,
          option_d_image: kind === "multi" ? (paths[3] ?? null) : null,
        })
        .select("id")
        .single();
      if (error) throw new Error(friendlyDbError(error.message));
      try {
        const { renderPreviewCard } = await import("@/lib/story-card");
        const og = await renderPreviewCard(picked.map((p) => p.blob));
        await uploadPreview({ data: { questionId: data.id, og: await toB64(og) } });
      } catch (e) {
        console.warn("Link preview image failed", e);
      }
      window.__lovableEvents?.track?.("project.question_created", { category, visibility, duration_hours: duration, kind });
      qc.invalidateQueries({ queryKey: ["questions"] });
      setCreated({ id: data.id, title: title.trim() || "Which one should I buy?" });
    } catch (err) {
      const offline = typeof navigator !== "undefined" && !navigator.onLine;
      toast.error(offline ? "You're offline. Pics didn't upload 📵" : "Upload flopped 😵 Check your pics and try again.", {
        description: offline ? "Reconnect and hit post again." : (err as Error).message,
      });
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
            {crewId ? "Only your crew can see this one. Tell them it's up 🫂" : isPublic ? "Your friends are already voting. Probably. Send it to make sure." : "Link only. Drop it in the group chat 👀"}
          </p>
          <Button variant="hero" className="mt-8 h-12 w-full" onClick={() => shareQuestion(created.id, created.title, "confirm")}>
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
        <Section label="Type">
          <div className="grid grid-cols-3 gap-2">
            {QUESTION_KINDS.map((k, i) => (
              <button
                key={k.value}
                type="button"
                onClick={() => setKind(k.value)}
                aria-pressed={kind === k.value}
                className={cn("rounded-xl px-2 py-2.5 text-left brut-sm press", kind === k.value ? "bg-yellow" : "bg-card", i === 1 ? "tilt-r" : "tilt-l")}
              >
                <span className="block font-display text-sm font-extrabold leading-tight">{k.label}</span>
                <span className="mt-0.5 block text-[11px] leading-tight text-muted-foreground">{k.hint}</span>
              </button>
            ))}
          </div>
        </Section>

        {kind === "buyskip" ? (
          <div className="mx-auto w-2/3">
            <PhotoPicker name="?" photo={photos[0]} set={setPhoto(0)} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: slots }, (_, i) => (
              <PhotoPicker key={i} name={"ABCD"[i]} photo={photos[i]} set={setPhoto(i)} optional={kind === "multi" && i === 3} />
            ))}
          </div>
        )}

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
          <Input className="h-12 rounded-xl bg-card" placeholder='"Which one for the wedding?"' value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
        </Section>

        <div className="grid grid-cols-2 gap-3">
          <Section label="Occasion" hint="optional">
            <Input className="h-12 rounded-xl bg-card" placeholder="e.g. Wedding" value={occasion} onChange={(e) => setOccasion(e.target.value)} maxLength={40} />
          </Section>
          <Section label="Budget" hint="optional">
            <Input className="h-12 rounded-xl bg-card" placeholder="e.g. up to €150" value={budget} onChange={(e) => setBudget(e.target.value)} maxLength={30} />
          </Section>
        </div>

        <Section label="Voting duration">
          <div className="grid grid-cols-3 gap-2 rounded-xl bg-card p-1 brut-sm">
            {DURATIONS.map((d) => (
              <button
                key={d.h}
                type="button"
                onClick={() => setDuration(d.h)}
                className={cn("rounded-lg py-2.5 text-sm font-extrabold", duration === d.h ? "bg-ink text-background" : "text-muted-foreground")}
              >
                {d.label}
              </button>
            ))}
          </div>
        </Section>

        {!!crews.data?.length && (
          <Section label="Who sees it?">
            <div className="flex flex-wrap gap-2">
              <Chip active={!crewId} onClick={() => setCrewId(null)}>🌍 Everyone</Chip>
              {crews.data.map((c) => (
                <Chip key={c.id} active={crewId === c.id} onClick={() => setCrewId(c.id)}>{c.emoji} {c.name}</Chip>
              ))}
            </div>
          </Section>
        )}

        {!crewId && <label className="flex items-center justify-between gap-4 rounded-2xl bg-card p-4 brut">
          <div>
            <p className="text-sm font-semibold">{isPublic ? "Show in public feed" : "Link only"}</p>
            <p className="text-xs text-muted-foreground">
              {isPublic ? "The whole internet can vote." : "Only people with the link. Lowkey mode."}
            </p>
          </div>
          <Switch checked={isPublic} onCheckedChange={setIsPublic} aria-label="Show in public feed" />
        </label>}

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

function PhotoPicker({ name, photo, set, optional }: { name: string; photo: Photo; set: (p: Photo) => void; optional?: boolean }) {
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
            <button type="button" aria-label={`Remove photo ${name}`} onClick={() => set(null)} className="absolute right-2 top-2 grid size-8 place-items-center rounded-md bg-card brut-sm">
              <X className="size-4" />
            </button>
            <span className="absolute left-2 top-2 grid size-9 place-items-center rounded-md bg-yellow font-display text-lg font-extrabold brut-sm tilt-l">{name}</span>
          </>
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-3 p-3">
            <span className="font-display text-5xl font-extrabold">{name}</span>
            {optional && <span className="-mt-2 text-[11px] font-bold text-muted-foreground">optional</span>}
            {working ? (
              <p className="text-xs text-muted-foreground">Shrinking…</p>
            ) : (
              <div className="flex w-full flex-col gap-2">
                <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-card py-2.5 text-xs font-extrabold brut-sm press">
                  <Camera className="size-4 text-foreground" /> Camera
                  <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={onFile} aria-label={`Take photo ${name}`} />
                </label>
                <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-card py-2.5 text-xs font-extrabold brut-sm press">
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
