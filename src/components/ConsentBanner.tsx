import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

const KEY = "jv-consent";

/** We only use essential storage; the banner informs and records the choice. */
export function ConsentBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => { if (!localStorage.getItem(KEY)) setShow(true); }, []);
  if (!show) return null;
  const choose = (v: "all" | "essential") => { localStorage.setItem(KEY, JSON.stringify({ v, at: new Date().toISOString() })); setShow(false); };
  return (
    <div className="fixed inset-x-0 bottom-28 z-[45] mx-auto max-w-md px-3" role="dialog" aria-label="Cookie consent">
      <div className="rounded-3xl p-4 glass">
        <p className="font-display text-[17px] font-semibold">Your privacy</p>
        <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">We only use essential storage to keep you logged in and remember your votes. No ads, no tracking. <Link to="/privacy" className="font-medium text-foreground underline">Privacy</Link></p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button variant="soft" className="h-11" onClick={() => choose("essential")}>Essentials only</Button>
          <Button variant="hero" className="h-11" onClick={() => choose("all")}>Accept</Button>
        </div>
      </div>
    </div>
  );
}
