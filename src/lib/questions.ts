import { logShareEvent, type ShareChannel } from "@/lib/share-events";
import { hasProfanity, PROFANITY_MSG, friendlyDbError } from "@/lib/profanity";
import { supabase } from "@/integrations/supabase/client";

export const BUCKET = "question-images";

export type Choice = "a" | "b" | "c" | "d";
export type QuestionKind = "ab" | "multi" | "buyskip";
export const QUESTION_KINDS: { value: QuestionKind; label: string; hint: string; min: number; max: number }[] = [
  { value: "ab", label: "A vs B", hint: "Two pics, one winner", min: 2, max: 2 },
  { value: "multi", label: "A vs B vs C", hint: "Up to 4 pics", min: 3, max: 4 },
  { value: "buyskip", label: "Buy it or skip it", hint: "One pic, yes or no", min: 1, max: 1 },
];
export type QOption = { key: Choice; url: string; votes: number; pct: number; label: string };

export type Question = {
  kind: QuestionKind;
  options: QOption[];
  id: string;
  user_id: string;
  hidden: boolean;
  title: string;
  category: string;
  option_a_label: string;
  option_b_label: string;
  option_a_url: string;
  option_b_url: string;
  created_at: string;
  author: string;
  votesA: number;
  votesB: number;
  myVote: Choice | null;
  commentCount: number;
  occasion: string | null;
  budget: string | null;
  visibility: string;
  ends_at: string | null;
  decided_choice: string | null;
  boosted_until: string | null;
};

type Row = {
  id: string;
  user_id: string;
  hidden?: boolean;
  title: string;
  category: string;
  option_a_label: string;
  option_a_image: string;
  option_b_label: string;
  option_b_image: string;
  option_c_image?: string | null;
  option_d_image?: string | null;
  kind?: string;
  created_at: string;
  occasion: string | null;
  budget: string | null;
  visibility: string;
  ends_at: string | null;
  decided_choice: string | null;
  boosted_until: string | null;
  profiles: { display_name: string | null } | null;
  votes: { choice: string; user_id: string }[];
  comments?: { count: number }[];
};

const SELECT = "*, profiles(display_name), votes(choice, user_id), comments(count)";

async function hydrate(rows: Row[]): Promise<Question[]> {
  const { data: { session } } = await supabase.auth.getSession();
  const uid = session?.user.id ?? guestId();
  const paths = [...new Set(rows.flatMap((r) => [r.option_a_image, r.option_b_image, r.option_c_image, r.option_d_image].filter((x): x is string => !!x)))];
  const urls: Record<string, string> = {};
  if (paths.length) {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 60 * 60);
    data?.forEach((d) => {
      if (d.path && d.signedUrl) urls[d.path] = d.signedUrl;
    });
  }
  return rows.map((r) => {
    const kind = (r.kind === "multi" || r.kind === "buyskip" ? r.kind : "ab") as QuestionKind;
    const imgs: [Choice, string | null | undefined][] = [["a", r.option_a_image], ["b", r.option_b_image], ["c", r.option_c_image], ["d", r.option_d_image]];
    const present = imgs.filter(([, p]) => !!p);
    const counts = present.map(([k]) => r.votes.filter((v) => v.choice === k).length);
    const pcts = percentAll(counts);
    const options: QOption[] = present.map(([k, p], i) => ({ key: k, url: urls[p as string] ?? "", votes: counts[i] ?? 0, pct: pcts[i] ?? 0, label: optionLabel(kind, k) }));
    return {
    kind,
    options,
    id: r.id,
    user_id: r.user_id,
    hidden: r.hidden ?? false,
    title: r.title,
    category: r.category,
    option_a_label: r.option_a_label,
    option_b_label: r.option_b_label,
    option_a_url: urls[r.option_a_image] ?? "",
    option_b_url: urls[r.option_b_image] ?? "",
    created_at: r.created_at,
    occasion: r.occasion,
    budget: r.budget,
    visibility: r.visibility,
    ends_at: r.ends_at,
    decided_choice: r.decided_choice,
    boosted_until: r.boosted_until,
    author: r.profiles?.display_name ?? "Someone",
    votesA: r.votes.filter((v) => v.choice === "a").length,
    votesB: r.votes.filter((v) => v.choice === "b").length,
    commentCount: r.comments?.[0]?.count ?? 0,
    myVote: (r.votes.find((v) => v.user_id === uid)?.choice as Choice | undefined) ?? null,
  };
  });
}

export function guestId() {
  if (typeof window === "undefined") return undefined;
  let id = localStorage.getItem("jv_guest_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("jv_guest_id", id);
  }
  return id;
}

export async function fetchFeed(categories?: string[]) {
  let q = supabase.from("questions").select(SELECT).eq("visibility", "public").order("created_at", { ascending: false }).limit(50);
  if (categories && categories.length) q = q.in("category", categories);
  const { data, error } = await q;
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

export async function fetchCrewQuestions(crewId: string) {
  const { data, error } = await supabase
    .from("questions")
    .select(SELECT)
    .eq("crew_id", crewId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return hydrate(data as unknown as Row[]);
}

export async function fetchQuestion(id: string) {
  const { data, error } = await supabase.from("questions").select(SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return (await hydrate([data as unknown as Row]))[0];
}

export async function castVote(questionId: string, choice: Choice) {
  const { data: { session } } = await supabase.auth.getSession();
  const uid = session?.user.id ?? guestId();
  if (!uid) throw new Error("Voting isn't available right now");
  const { error } = await supabase
    .from("votes")
    .insert({ question_id: questionId, user_id: uid, choice, anonymous: !session });
  if (error) {
    if (error.code === "23505") throw new Error("You already voted on this one");
    if (typeof navigator !== "undefined" && !navigator.onLine) throw new Error("You're offline. Vote didn't send 📵");
    if (/closed|ended|expired/i.test(error.message)) throw new Error("Too late! Voting on this one already ended ⏰");
    throw new Error("Vote didn't go through. Try again?");
  }
  if (typeof window !== "undefined") {
    window.__lovableEvents?.track?.("project.vote_cast", { choice, signed_in: !!session });
    window.dispatchEvent(new Event("jv:voted"));
  }
}

export const FEEDBACK_TAGS = ["Design", "Quality", "Price", "Style", "Features"] as const;
export const COMMENT_MAX = 140;

export type Feedback = { id: string; voter_id: string; tags: string[]; comment: string | null; created_at: string };

export async function fetchFeedback(questionId: string): Promise<Feedback[]> {
  const { data, error } = await supabase
    .from("vote_feedback")
    .select("id, voter_id, tags, comment, created_at")
    .eq("question_id", questionId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function myVoterId() {
  const { data: { session } } = await supabase.auth.getSession();
  return { id: session?.user.id ?? guestId(), anonymous: !session };
}

export async function sendFeedback(questionId: string, tags: string[], comment: string) {
  const trimmed = comment.trim();
  if (trimmed.length > COMMENT_MAX) throw new Error(`Max ${COMMENT_MAX} characters`);
  if (hasProfanity(trimmed)) throw new Error(PROFANITY_MSG);
  const { id, anonymous } = await myVoterId();
  if (!id) throw new Error("Not available right now");
  const { error } = await supabase
    .from("vote_feedback")
    .insert({ question_id: questionId, voter_id: id, anonymous, tags, comment: trimmed || null });
  if (error) {
    if (error.code === "23505") throw new Error("You already left feedback");
    throw new Error(friendlyDbError(error.message));
  }
}

export function percent(a: number, b: number) {
  const total = a + b;
  if (!total) return [0, 0] as const;
  const pa = Math.round((a / total) * 100);
  return [pa, 100 - pa] as const;
}

/** Percentages for any number of options, rounded so they add up to 100 (largest remainder). */
export function percentAll(counts: number[]): number[] {
  const total = counts.reduce((s, n) => s + n, 0);
  if (!total) return counts.map(() => 0);
  const raw = counts.map((n) => (n / total) * 100);
  const out = raw.map(Math.floor);
  let left = 100 - out.reduce((s, n) => s + n, 0);
  const order = raw.map((v, i) => [v - Math.floor(v), i] as const).sort((x, y) => y[0] - x[0]);
  for (const [, i] of order) { if (left <= 0) break; out[i] = (out[i] ?? 0) + 1; left--; }
  return out;
}

/** Display name of an option: "Buy it"/"Skip it" for buy-or-skip, otherwise the letter. */
export function optionLabel(kind: QuestionKind, key: Choice) {
  if (kind === "buyskip") return key === "a" ? "Buy it" : "Skip it";
  return key.toUpperCase();
}

export const OPTION_COLORS: Record<Choice, string> = { a: "bg-chrome", b: "bg-lime", c: "bg-pink", d: "bg-card" };

/** Total votes and the voter's share for a question. */
export function totals(q: Pick<Question, "options" | "myVote">) {
  const total = q.options.reduce((s, o) => s + o.votes, 0);
  const mine = q.options.find((o) => o.key === q.myVote)?.pct ?? 0;
  return { total, mine };
}

/** Add one vote locally and recompute percentages. */
export function withVote<T extends Pick<Question, "options" | "myVote">>(q: T, c: Choice): T {
  const counts = q.options.map((o) => o.votes + (o.key === c ? 1 : 0));
  const pcts = percentAll(counts);
  return { ...q, myVote: c, options: q.options.map((o, i) => ({ ...o, votes: counts[i] ?? 0, pct: pcts[i] ?? 0 })) };
}

export function isClosed(q: { ends_at: string | null }, now = Date.now()) {
  return !!q.ends_at && new Date(q.ends_at).getTime() <= now;
}

export function timeLeft(endsAt: string | null, now = Date.now()) {
  if (!endsAt) return "";
  const ms = new Date(endsAt).getTime() - now;
  if (ms <= 0) return "Voting closed";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h left`;
  if (h >= 1) return `${h}h ${m}m left`;
  return `${Math.max(m, 1)}m left`;
}

export function displayTitle(q: { title: string }) {
  return q.title.trim() || "Which one should I buy?";
}

export function shareUrl(id: string) {
  return `${window.location.origin}/q/${id}?s=1`;
}

export async function shareQuestion(id: string, title: string, channel: ShareChannel = "link") {
  const url = shareUrl(id);
  logShareEvent("share_click", id, channel);
  window.__lovableEvents?.track?.("project.share_clicked", { channel });
  const text = `${title} Help me decide on Just Vote 🗳️`;
  if (navigator.share) {
    try {
      await navigator.share({ title: "Just Vote", text, url });
      return;
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
    }
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, "_blank", "noopener");
}

export type FeedSort = "new" | "ending";
export type FeedItem = Question & { matched: boolean };
export const FEED_PAGE = 10;

/** One page of the feed: open, public, not created or voted by me; my interests first. */
export async function fetchFeedPage(opts: {
  interests: string[] | null;
  category: string | null;
  sort: FeedSort;
  offset: number;
}): Promise<FeedItem[]> {
  const { voterId } = { voterId: (await myVoterId()).id ?? null };
  const { data, error } = await supabase.rpc("feed_page", {
    p_voter: voterId as string,
    p_interests: (opts.category ? null : opts.interests) as string[],
    p_category: opts.category as string,
    p_sort: opts.sort,
    p_limit: FEED_PAGE,
    p_offset: opts.offset,
  });
  if (error) throw error;
  if (!data?.length) return [];
  const ids = data.map((r) => r.id);
  const { data: rows, error: e2 } = await supabase.from("questions").select(SELECT).in("id", ids);
  if (e2) throw e2;
  const hydrated = await hydrate(rows as unknown as Row[]);
  const byId = new Map(hydrated.map((h) => [h.id, h]));
  return data.flatMap((r) => {
    const h = byId.get(r.id);
    return h ? [{ ...h, matched: r.matched }] : [];
  });
}

export async function decideQuestion(id: string, choice: Choice | "neither") {
  const { error } = await supabase.rpc("decide_question", { p_question: id, p_choice: choice });
  if (error) throw error;
}

export function decisionLabel(choice: string | null, kind: QuestionKind = "ab") {
  if (kind === "buyskip" && choice === "a") return "Bought it";
  if (kind === "buyskip" && choice === "b") return "Skipped it";
  if (choice && ["a", "b", "c", "d"].includes(choice)) return `Went with ${choice.toUpperCase()}`;
  if (choice === "neither") return "Chose neither";
  return null;
}

export const BOOST_COST = 10;

/** Points for one vote: 2 in a category the voter is interested in, otherwise 1. */
export function votePoints(category: string, interests: string[]) {
  return interests.includes(category) ? 2 : 1;
}

export function isBoosted(q: { boosted_until: string | null }, now = Date.now()) {
  return !!q.boosted_until && new Date(q.boosted_until).getTime() > now;
}

export async function boostQuestion(id: string) {
  const { error } = await supabase.rpc("boost_question", { p_question: id });
  if (error) throw error;
}

export async function fetchMyStats() {
  const { data, error } = await supabase.rpc("my_stats");
  if (error) throw error;
  return data?.[0] ?? { points: 0, streak: 0 };
}

export const REPORT_REASONS = [
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "faces_without_consent", label: "Shows people without permission" },
  { value: "spam", label: "Spam or advertising" },
  { value: "other", label: "Something else" },
] as const;

export async function reportQuestion(questionId: string, reason: string, details: string) {
  const { id, anonymous } = await myVoterId();
  if (!id) throw new Error("Not available right now");
  const { error } = await supabase
    .from("reports")
    .insert({ question_id: questionId, reporter_id: id, anonymous, reason, details: details.trim() || null });
  if (error) {
    if (error.code === "23505") throw new Error("You already reported this question");
    throw error;
  }
}
