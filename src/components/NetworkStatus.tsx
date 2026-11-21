import { useEffect, useState } from "react";
import { toast } from "sonner";

/** Toasts + sticky banner when the device goes offline. */
export function NetworkStatus() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    setOffline(!navigator.onLine);
    const off = () => { setOffline(true); toast.error("You're offline. Votes will go through once you're back."); };
    const on = () => { setOffline(false); toast.success("Back online."); };
    window.addEventListener("offline", off);
    window.addEventListener("online", on);
    return () => { window.removeEventListener("offline", off); window.removeEventListener("online", on); };
  }, []);
  if (!offline) return null;
  return (
    <div role="status" className="fixed inset-x-0 top-0 z-[60] mx-auto max-w-md bg-destructive/90 px-4 pb-1.5 pt-[max(0.375rem,env(safe-area-inset-top))] text-center text-[13px] font-medium text-destructive-foreground backdrop-blur">
      No internet connection
    </div>
  );
}
