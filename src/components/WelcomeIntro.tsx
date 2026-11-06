import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
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
          <button onClick={finish} className="text-sm font-extrabold underline underline-offset-4">Skip</button>
        </div>

        <div key={step} className="animate-page flex flex-1 flex-col pt-8">
          {step === 0 && (
            <>
              <div className="flex justify-center gap-3 py-6">
                <span className="tilt-l grid size-28 place-items-center rounded-2xl bg-primary font-display text-6xl font-extrabold brut">A</span>
                <span className="tilt-r grid size-28 place-items-center rounded-2xl bg-lime font-display text-6xl font-extrabold brut">B</span>
              </div>
              <h1 className="text-[2.6rem] leading-[0.95]">Can't pick? Just vote.</h1>
              <p className="mt-3 text-lg font-medium">Post two pics of stuff you wanna buy. Strangers pick one. You stop overthinking. Win-win.</p>
            </>
          )}
          {step === 1 && (
            <>
              <h1 className="text-[2.4rem] leading-[0.95]">What are you nosy about?</h1>
              <p className="mt-2 font-medium">Pick your categories. Change it anytime, no drama.</p>
              <div className="mt-6"><InterestPicker value={interests} onChange={setInterests} /></div>
            </>
          )}
          {step === 2 && (
            <>
              <p className="tilt-l self-start rounded-lg bg-yellow px-3 py-1 font-display text-lg font-extrabold brut-sm">Your first vote 👆</p>
              <h1 className="mt-5 text-[2.6rem] leading-[0.95]">Tap a photo. That's it.</h1>
              <p className="mt-3 text-lg font-medium">One tap = one vote. Swipe up for the next one. No login needed.</p>
              <div className="relative mt-8 grid grid-cols-2 gap-3">
                <div className="h-36 rounded-2xl bg-card brut" />
                <div className="h-36 rounded-2xl bg-card brut" />
                <span className="animate-wiggle absolute left-[18%] top-[45%] text-5xl" aria-hidden>👆</span>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="flex gap-2" aria-label={`Step ${step + 1} of 3`}>
            {[0, 1, 2].map((i) => (
              <span key={i} className={cn("h-3 rounded-full border-2 transition-all", i === step ? "w-8 bg-primary" : "w-3 bg-card")} />
            ))}
          </div>
          <Button
            variant="hero"
            className="h-12 min-w-36"
            onClick={() => (step < 2 ? setStep(step + 1) : finish())}
          >
            {step === 0 ? "Show me" : step === 1 ? "Looks good" : "Let me vote!"}
          </Button>
        </div>
      </div>
    </div>
  );
}
