import { useState } from "react";
import { ImageDown, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { displayTitle, shareQuestion, type Question } from "@/lib/questions";
import { shareStoryCard } from "@/lib/story-card";
import { logShareEvent } from "@/lib/share-events";

export function ShareButtons({ q }: { q: Question }) {
  const [busy, setBusy] = useState(false);
  async function story() {
    setBusy(true);
    try {
      logShareEvent("share_click", q.id, "story");
      window.__lovableEvents?.track?.("project.share_clicked", { channel: "story" });
      const r = await shareStoryCard(q);
      if (r === "downloaded") toast.success("Story card saved. Post it, bestie 📲");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="grid grid-cols-2 gap-3">
      <Button variant="soft" className="h-13" disabled={busy} onClick={story}>
        <ImageDown /> {busy ? "Cooking…" : "Story card"}
      </Button>
      <Button variant="lime" className="h-13" onClick={() => shareQuestion(q.id, displayTitle(q))}>
        <Link2 /> Send link
      </Button>
    </div>
  );
}
