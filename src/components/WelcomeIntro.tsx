import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChromeStar, Logo } from "@/components/Logo";
import { Hand } from "lucide-react";
import { InterestPicker } from "@/components/InterestPicker";
import { CATEGORIES } from "@/lib/categories";
import { cn } from "@/lib/utils";

const SEEN = "jv-intro-seen";
export const GUEST_INTERESTS = "jv-guest-interests";

export function readGuestInterests(): string[] | null {
  try {
    const v = JSON.parse(localStorage.getItem(GUEST_INTERESTS) ?? "null");
    return Array.isArray(v) && v.length ? v : null;
  } catch {
    return null;
  }
}

/** 3-screen intro on first visit: what it is → pick categories → first vote. */
export function WelcomeIntro({ onDone }: { onDone?: () => void }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [interests, setInterests] = useState<string[]>([...CATEGORIES]);

  useEffect(() => {
    if (!localStorage.getItem(SEEN)) setOpen(true);
  }, []);

  function finish() {
    localStorage.setItem(SEEN, "1");
    localStorage.setItem(GUEST_INTERESTS, JSON.stringify(interests));
    setOpen(false);
    onDone?.();
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background" role="dialog" aria-modal="true" aria-label="Welcome to Just Vote">
      <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-5 pb-6 pt-6">
        <div className="flex items-center justify-between">
          <Logo />
          <button onClick={finish} className="rounded-full px-3 py-1.5 text-[15px] text-muted-foreground press">Skip</button>
        </div>

        <div key={step} className="animate-page flex flex-1 flex-col pt-8">
          {step === 0 && (
            <>
              <div className="relative mx-auto my-6 grid aspect-square w-full max-w-[300px] place-items-center overflow-hidden rounded-[36px] bg-[#1f2f1c] brut">
                <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_45%,rgba(255,255,255,0.12),transparent_70%)]" />
                <ChromeStar className="animate-pop size-48" />
              </div>
              <h1 className="text-[40px] leading-[1.02] tracking-[-0.035em]">Can't decide?<br /><span className="text-chrome">Just vote.</span></h1>
              <p className="mt-4 text-[17px] leading-relaxed text-muted-foreground">Post the options you're torn between. People pick one. You stop overthinking.</p>
            </>
          )}
          {step === 1 && (
            <>
              <h1 className="text-[34px] leading-[1.05] tracking-[-0.03em]">What are you into?</h1>
              <p className="mt-2 text-[17px] text-muted-foreground">Pick your categories. You can change them anytime.</p>
              <div className="mt-6"><InterestPicker value={interests} onChange={setInterests} /></div>
            </>
          )}
          {step === 2 && (
            <>
              <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Your first vote</p>
              <h1 className="mt-2 text-[34px] leading-[1.05] tracking-[-0.03em]">Tap a photo.<br />That's it.</h1>
              <p className="mt-3 text-[17px] leading-relaxed text-muted-foreground">One tap is one vote. Swipe up for the next. No account needed.</p>
              <div className="relative mt-8 grid grid-cols-2 gap-2.5">
                <div className="h-40 rounded-[24px] bg-card ring-iridescent" />
                <div className="h-40 rounded-[24px] bg-card brut" />
                <Hand className="animate-wiggle absolute left-[20%] top-[42%] size-10 text-foreground" strokeWidth={1.5} aria-hidden />
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="flex gap-2" aria-label={`Step ${step + 1} of 3`}>
            {[0, 1, 2].map((i) => (
              <span key={i} className={cn("h-2 rounded-full shadow-none transition-all duration-500", i === step ? "w-6 bg-chrome" : "w-2 bg-white/20")} />
            ))}
          </div>
          <Button
            variant="hero"
            className="h-12 min-w-36"
            onClick={() => (step < 2 ? setStep(step + 1) : finish())}
          >
            {step === 0 ? "Show me" : step === 1 ? "Looks good" : "Start voting"}
          </Button>
        </div>
      </div>
    </div>
  );
}
