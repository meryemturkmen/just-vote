import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { BUCKET } from "@/lib/questions";

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

type Opt = { file: File | null; preview: string; label: string };

function NewQuestion() {
  const { user } = Route.useRouteContext();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [a, setA] = useState<Opt>({ file: null, preview: "", label: "" });
  const [b, setB] = useState<Opt>({ file: null, preview: "", label: "" });
  const [busy, setBusy] = useState(false);

  async function upload(f: File) {
    const ext = f.name.split(".").pop() || "jpg";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, f, { contentType: f.type });
    if (error) throw error;
    return path;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!a.file || !b.file) { toast.error("Please add a photo for both options"); return; }
    setBusy(true);
    try {
      const [pa, pb] = await Promise.all([upload(a.file), upload(b.file)]);
      const { data, error } = await supabase
        .from("questions")
        .insert({
          user_id: user.id,
          title: title.trim(),
          option_a_label: a.label.trim(),
          option_a_image: pa,
          option_b_label: b.label.trim(),
          option_b_image: pb,
        })
        .select("id")
        .single();
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["questions"] });
      toast.success("Your question is live! 🎉");
      nav({ to: "/q/$id", params: { id: data.id } });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title="What can't you decide?">
      <form onSubmit={submit} className="space-y-6">
        <Input
          className="h-12 rounded-2xl"
          placeholder="e.g. Which sneakers should I get?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <Picker name="Option A" opt={a} set={setA} />
          <Picker name="Option B" opt={b} set={setB} />
        </div>
        <Button type="submit" variant="hero" disabled={busy} className="h-12 w-full">
          {busy ? "Posting…" : "Ask the crowd"}
        </Button>
      </form>
    </AppShell>
  );
}

function Picker({ name, opt, set }: { name: string; opt: Opt; set: (o: Opt) => void }) {
  return (
    <div className="space-y-2">
      <label className="block cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed bg-muted">
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          aria-label={`${name} photo`}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) set({ ...opt, file: f, preview: URL.createObjectURL(f) });
          }}
        />
        <div className="grid aspect-[3/4] place-items-center">
          {opt.preview ? (
            <img src={opt.preview} alt={name} className="size-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <span className="grid size-11 place-items-center rounded-full bg-primary-soft text-primary">
                <ImagePlus className="size-5" />
              </span>
              <span className="text-xs font-medium">{name}</span>
            </div>
          )}
        </div>
      </label>
      <Input
        className="h-10 rounded-xl"
        placeholder={`${name} name`}
        value={opt.label}
        onChange={(e) => set({ ...opt, label: e.target.value })}
        maxLength={40}
        required
      />
    </div>
  );
}
