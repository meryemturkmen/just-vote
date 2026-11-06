import { supabase } from "@/integrations/supabase/client";

export type ShareChannel = "link" | "story" | "confirm" | "direct";

/** Anonymous counter row for the admin dashboard (no user id, no IP). */
export function logShareEvent(kind: "share_click" | "link_open", questionId: string, channel?: ShareChannel) {
  void supabase.from("share_events").insert({ kind, question_id: questionId, channel: channel ?? null }).then(() => {});
}
