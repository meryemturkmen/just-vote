import { supabase } from "@/integrations/supabase/client";

export type AppNotification = {
  id: string;
  question_id: string;
  kind: "votes" | "ended";
  count: number;
  read: boolean;
  updated_at: string;
  title: string;
};

export async function fetchNotifications(): Promise<AppNotification[]> {
  await supabase.rpc("sync_ended_notifications");
  const { data, error } = await supabase
    .from("notifications")
    .select("id, question_id, kind, count, read, updated_at, questions(title)")
    .order("updated_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data.map((n) => ({
    id: n.id,
    question_id: n.question_id,
    kind: n.kind as "votes" | "ended",
    count: n.count,
    read: n.read,
    updated_at: n.updated_at,
    title: (n.questions as { title: string } | null)?.title?.trim() || "Which one should I buy?",
  }));
}

export async function markAllRead() {
  const { error } = await supabase.from("notifications").update({ read: true }).eq("read", false);
  if (error) throw error;
}

export function notificationText(n: Pick<AppNotification, "kind" | "count">) {
  if (n.kind === "ended") return "Voting has ended — see the final results";
  return n.count === 1 ? "1 new vote" : `${n.count} new votes`;
}
