import { useEffect, useState } from "react";
import { X } from "lucide-react";

const KEY = "jv-install-hint";

export function InstallHint() {
  const [show, setShow] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone;
    const mobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
    if (standalone || !mobile || localStorage.getItem(KEY)) return;
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const onVote = () => {
      if (localStorage.getItem(KEY)) return;
      localStorage.setItem(KEY, "1");
      setTimeout(() => setShow(true), 1800);
    };
    window.addEventListener("jv:voted", onVote);
    return () => window.removeEventListener("jv:voted", onVote);
  }, []);

  if (!show) return null;
  return (
    <div className="fixed inset-x-0 bottom-28 z-50 mx-auto max-w-md px-4">
      <div className="animate-pop relative rounded-2xl bg-yellow p-4 pr-12 brut">
        <button onClick={() => setShow(false)} aria-label="Close" className="absolute right-2 top-2 grid size-9 place-items-center rounded-lg bg-card brut-sm press">
          <X className="size-4" strokeWidth={3} />
        </button>
        <p className="font-display text-xl font-extrabold leading-tight">Ok you're hooked 👀</p>
        <p className="mt-1 text-sm font-medium">
          {ios ? <>Tap <b>Share</b> → <b>Add to Home Screen</b> to keep Just Vote one tap away.</> : <>Tap the <b>⋮ menu</b> → <b>Add to Home screen</b> to keep Just Vote one tap away.</>}
        </p>
      </div>
    </div>
  );
}
