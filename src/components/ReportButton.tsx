import { useState } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { REPORT_REASONS, reportQuestion } from "@/lib/questions";
import { cn } from "@/lib/utils";

export function ReportButton({ questionId, compact }: { questionId: string; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await reportQuestion(questionId, reason, details);
      toast.success("Thanks — we'll take a look.");
      setOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Report question"
        className={cn("inline-flex items-center gap-1 text-xs font-medium text-muted-foreground", !compact && "rounded-full px-2 py-1")}
      >
        <Flag className="size-3.5" /> {!compact && "Report"}
      </button>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="font-display text-xl">Report this question</DrawerTitle>
            <DrawerDescription>What's wrong with it?</DrawerDescription>
          </DrawerHeader>
          <div className="space-y-2 px-4 pb-6">
            {REPORT_REASONS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setReason(r.value)}
                className={cn("w-full rounded-2xl border px-4 py-3 text-left text-sm font-medium", reason === r.value && "border-primary bg-primary-soft")}
              >
                {r.label}
              </button>
            ))}
            <Textarea className="rounded-2xl" placeholder="Anything else? (optional)" maxLength={300} value={details} onChange={(e) => setDetails(e.target.value)} />
            <Button variant="hero" className="h-12 w-full" disabled={!reason || busy} onClick={submit}>Send report</Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
