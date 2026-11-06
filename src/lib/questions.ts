import { supabase } from "@/integrations/supabase/client";

export const BUCKET = "question-images";

export type Question = {
  id: string;
  user_id: string;
  title: string;
  option_a_label: string;
  option_b_label: string;
  option_a_url: string;
  option_b_url: string;
  created_at: string;
  author: string;
  votesA: number;
  votesB: number;
  myVote: "a" | "b" | null;
};

type Row = {
  id: string;
  user_id: string;
  title: string;
  option_a_label: string;
  option_a_image: string;
  option_b_label: string;
  option_b_image: string;
  created_at: string;
  profiles: { display_name: string | null } | null;
  votes: { choice: string; user_id: string }[];
};

const SELECT = "*, profiles(display_name), votes(choice, user_id)";

async function hydrate(rows: Row[]): Promise<Question[]> {
  const { data: { session } } = await supabase.auth.getSession();
  const uid = session?.user.id;
  const paths = rows.flatMap((r) => [r.option_a_image, r.option_b_image]);
  const urls: Record<string, string> = {};
  if (paths.length) {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 60 * 60);
    data?.forEach((d) => {
      if (d.path && d.signedUrl) urls[d.path] = d.signedUrl;
    });
  }
  return rows.map((r) => ({
    id: r.id,
    user_id: r.user_id,
    title: r.title,
    option_a_label: r.option_a_label,
    option_b_label: r.option_b_label,
    option_a_url: urls[r.option_a_image] ?? "",
    option_b_url: urls[r.option_b_image] ?? "",
    created_at: r.created_at,
    author: r.profiles?.display_name ?? "Someone",
    votesA: r.votes.filter((v) => v.choice === "a").length,
    votesB: r.votes.filter((v) => v.choice === "b").length,
    myVote: (r.votes.find((v) => v.user_id === uid)?.choice as "a" | "b" | undefined) ?? null,
  }));
}

export async function fetchFeed() {
  const { data, error } = await supabase
    .from("questions")
    .select(SELECT)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return hydrate(data as unknown as Row[]);
}

export async function fetchMine(userId: string) {
  const { data, error } = await supabase
    .from("questions")
    .select(SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return hydrate(data as unknown as Row[]);
}

export async function fetchQuestion(id: string) {
  const { data, error } = await supabase.from("questions").select(SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return (await hydrate([data as unknown as Row]))[0];
}

export async function castVote(questionId: string, choice: "a" | "b") {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in to vote");
  const { error } = await supabase
    .from("votes")
    .upsert({ question_id: questionId, user_id: user.id, choice }, { onConflict: "question_id,user_id" });
  if (error) throw error;
}

export function percent(a: number, b: number) {
  const total = a + b;
  if (!total) return [0, 0] as const;
  const pa = Math.round((a / total) * 100);
  return [pa, 100 - pa] as const;
}
