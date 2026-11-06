import { useEffect, useState } from "react";
import { toast } from "sonner";

/** Toasts + sticky banner when the device goes offline. */
export function NetworkStatus() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    setOffline(!navigator.onLine);
    const off = () => { setOffline(true); toast.error("You're offline 📵 Votes won't go through till you're back."); };
    const on = () => { setOffline(false); toast.success("Back online. Carry on judging 🫡"); };
    window.addEventListener("offline", off);
    window.addEventListener("online", on);
    return () => { window.removeEventListener("offline", off); window.removeEventListener("online", on); };
  }, []);
  if (!offline) return null;
  return (
    <div role="status" className="fixed inset-x-0 top-0 z-[60] mx-auto max-w-md border-b-2 bg-destructive px-4 py-1.5 text-center text-sm font-extrabold text-destructive-foreground">
      No internet. Wifi said bye 👋
    </div>
  );
}
