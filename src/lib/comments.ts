import { supabase } from "@/integrations/supabase/client";
import { friendlyDbError, hasProfanity, PROFANITY_MSG } from "@/lib/profanity";
import { myVoterId } from "@/lib/questions";

export const COMMENT_LIMIT = 200;
export const REACTIONS = ["🔥", "😂", "💯", "👀", "💀"] as const;
export type CommentSort = "top" | "new";

export type Comment = {
  id: string;
  question_id: string;
  parent_id: string | null;
  author_id: string;
  anonymous: boolean;
  choice: "a" | "b";
  body: string;
  tags: string[];
  hidden: boolean;
  created_at: string;
  author: string;
  reactions: Record<string, number>;
  reactionTotal: number;
  myReaction: string | null;
  replies: Comment[];
};

type Row = Omit<Comment, "author" | "reactions" | "reactionTotal" | "myReaction" | "replies"> & {
  comment_reactions: { emoji: string; reactor_id: string }[];
};

/** Top = most reactions first (newest breaks ties); New = newest first. Replies stay oldest-first. */
export function sortComments<T extends { reactionTotal: number; created_at: string }>(list: T[], sort: CommentSort) {
  return [...list].sort((a, b) =>
    sort === "top" && b.reactionTotal !== a.reactionTotal
      ? b.reactionTotal - a.reactionTotal
      : b.created_at.localeCompare(a.created_at),
  );
}

export async function fetchComments(questionId: string): Promise<Comment[]> {
  const { id: me } = await myVoterId();
  const { data, error } = await supabase
    .from("comments")
    .select("id, question_id, parent_id, author_id, anonymous, choice, body, tags, hidden, created_at, comment_reactions(emoji, reactor_id)")
    .eq("question_id", questionId)
    .order("created_at", { ascending: true })
    .limit(500);
  if (error) throw error;
  const rows = data as unknown as Row[];
  const ids = [...new Set(rows.filter((r) => !r.anonymous).map((r) => r.author_id))];
  const names: Record<string, string> = {};
  if (ids.length) {
    const { data: ps } = await supabase.from("profiles").select("id, display_name").in("id", ids);
    ps?.forEach((p) => (names[p.id] = p.display_name ?? "Someone"));
  }
  const all: Comment[] = rows.map(({ comment_reactions: rx, ...r }) => {
    const reactions: Record<string, number> = {};
    rx.forEach((x) => (reactions[x.emoji] = (reactions[x.emoji] ?? 0) + 1));
    return {
      ...r,
      author: r.anonymous ? "Anon voter" : names[r.author_id] ?? "Someone",
      reactions,
      reactionTotal: rx.length,
      myReaction: rx.find((x) => x.reactor_id === me)?.emoji ?? null,
      replies: [],
    };
  });
  const byId = new Map(all.map((c) => [c.id, c]));
  const top: Comment[] = [];
  for (const c of all) {
    const parent = c.parent_id ? byId.get(c.parent_id) : null;
    if (parent) parent.replies.push(c);
    else if (!c.parent_id) top.push(c);
  }
  return top;
}

export async function postComment(questionId: string, body: string, tags: string[], parentId: string | null) {
  const text = body.trim();
  if (text.length > COMMENT_LIMIT) throw new Error(`Max ${COMMENT_LIMIT} characters`);
  if (!text && !tags.length) throw new Error("Say something first 🙃");
  if (hasProfanity(text)) throw new Error(PROFANITY_MSG);
  const { id, anonymous } = await myVoterId();
  if (!id) throw new Error("Not available right now");
  const { error } = await supabase.from("comments").insert({
    question_id: questionId, author_id: id, anonymous, body: text, tags: parentId ? [] : tags, parent_id: parentId,
  });
  if (error) throw new Error(friendlyDbError(error.message));
}

export async function toggleReaction(commentId: string, emoji: string) {
  const { id, anonymous } = await myVoterId();
  const { error } = await supabase.rpc("toggle_reaction", {
    p_comment: commentId, p_emoji: emoji, p_guest: (anonymous ? id : undefined) as string,
  });
  if (error) throw new Error(friendlyDbError(error.message));
}

export async function setCommentHidden(commentId: string, hidden: boolean) {
  const { error } = await supabase.rpc("set_comment_hidden", { p_comment: commentId, p_hidden: hidden });
  if (error) throw error;
}

export async function reportComment(commentId: string, reason: string, details: string) {
  const { id, anonymous } = await myVoterId();
  if (!id) throw new Error("Not available right now");
  const { error } = await supabase
    .from("comment_reports")
    .insert({ comment_id: commentId, reporter_id: id, anonymous, reason, details: details.trim() || null });
  if (error) {
    if (error.code === "23505") throw new Error("You already reported this comment");
    throw error;
  }
}
