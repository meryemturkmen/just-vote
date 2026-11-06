import { supabase } from "@/integrations/supabase/client";
import { hasProfanity } from "@/lib/profanity";

export const AVATAR_EMOJIS = ["😎", "🤠", "👽", "🐸", "🦄", "🍕", "🔥", "💅", "🧃", "🐙", "👾", "🌚"] as const;
export const AVATAR_COLORS = ["yellow", "pink", "lime", "card"] as const;
export type AvatarColor = (typeof AVATAR_COLORS)[number];

/** Usernames: 3–20 chars, lowercase letters, digits, underscore, no swear words. */
export function usernameError(u: string): string | null {
  if (!/^[a-z0-9_]{3,20}$/.test(u)) return "3–20 chars: a–z, 0–9 or _";
  if (hasProfanity(u.replace(/_/g, " "))) return "Keep it clean 🧼";
  return null;
}

export function normalizeUsername(u: string) {
  return u.trim().toLowerCase().replace(/^@/, "");
}

export type PublicProfile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_emoji: string;
  avatar_color: string;
  top_categories: string[];
  followers: number;
  following: number;
  week_points: number;
  votes: number;
  i_follow: boolean;
};

export async function fetchPublicProfile(username: string): Promise<PublicProfile | null> {
  const { data, error } = await supabase.rpc("public_profile", { p_username: username });
  if (error) throw error;
  return (data?.[0] as PublicProfile | undefined) ?? null;
}

export async function setFollow(followerId: string, followeeId: string, follow: boolean) {
  const { error } = follow
    ? await supabase.from("follows").insert({ follower_id: followerId, followee_id: followeeId })
    : await supabase.from("follows").delete().eq("follower_id", followerId).eq("followee_id", followeeId);
  if (error && error.code !== "23505") throw error;
}

export type LeaderRow = { user_id: string; username: string; display_name: string | null; avatar_emoji: string; avatar_color: string; points: number };

export async function fetchLeaderboard(category: string | null, scope: "all" | "following"): Promise<LeaderRow[]> {
  const { data, error } = await supabase.rpc("leaderboard", { p_category: category as string, p_scope: scope });
  if (error) throw error;
  return (data ?? []) as LeaderRow[];
}

export type Crew = { id: string; name: string; emoji: string; owner_id: string; invite_code: string; members: number };

export async function fetchMyCrews(): Promise<Crew[]> {
  const { data, error } = await supabase
    .from("crews")
    .select("id, name, emoji, owner_id, invite_code, crew_members(count)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((c) => ({ ...c, members: (c.crew_members as { count: number }[])?.[0]?.count ?? 0 }));
}

export async function createCrew(name: string, emoji: string) {
  if (!name.trim()) throw new Error("Give your crew a name");
  if (hasProfanity(name)) throw new Error("Whoa, language 🧼");
  const { data, error } = await supabase.rpc("create_crew", { p_name: name.trim(), p_emoji: emoji });
  if (error) throw new Error(/profanity/.test(error.message) ? "Whoa, language 🧼" : error.message);
  return data as string;
}

export function inviteUrl(code: string) {
  return `${window.location.origin}/join/${code}`;
}

export async function joinCrew(code: string) {
  const { data, error } = await supabase.rpc("join_crew", { p_code: code });
  if (error) throw error;
  return data as string;
}
