import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EyeOff, Eye, Reply } from "lucide-react";
import { toast } from "sonner";
import { Chip } from "@/components/CategoryChips";
import { ReportButton } from "@/components/ReportButton";
import { Bone } from "@/components/Skeleton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/hooks/use-session";
import {
  COMMENT_LIMIT, REACTIONS, fetchComments, postComment, reportComment, setCommentHidden, sortComments, toggleReaction,
  type Comment, type CommentSort,
} from "@/lib/comments";
import { FEEDBACK_TAGS, type Question } from "@/lib/questions";
import { cn } from "@/lib/utils";

/** Full comments section; only rendered once the viewer has voted. */
export function CommentSection({ q }: { q: Question }) {
  const { user } = useUser();
  const [sort, setSort] = useState<CommentSort>("top");
  const key = ["comments", q.id];
  const { data, isLoading } = useQuery({ queryKey: key, queryFn: () => fetchComments(q.id) });
  const isOwner = user?.id === q.user_id;
  const count = (data ?? []).reduce((n, c) => n + 1 + c.replies.length, 0);

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-2xl">The comments 🍿 <span className="text-base">({count})</span></h2>
        <div className="flex gap-1.5">
          <Chip active={sort === "top"} onClick={() => setSort("top")}>Top</Chip>
          <Chip active={sort === "new"} onClick={() => setSort("new")}>New</Chip>
        </div>
      </div>
      <Composer q={q} parentId={null} signedIn={!!user} />
      {isLoading && <div className="mt-4 space-y-3"><Bone className="h-24" /><Bone className="h-24" /></div>}
      {data?.length === 0 && <p className="mt-5 font-bold">Dead silence 🦗 Be the first to say something.</p>}
      <ul className="mt-5 space-y-4">
        {data && sortComments(data, sort).map((c, i) => (
          <li key={c.id}>
            <CommentItem c={c} q={q} tilt={i % 2 ? 1 : -1} isOwner={isOwner} signedIn={!!user} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function Composer({ q, parentId, signedIn, onDone }: { q: Question; parentId: string | null; signedIn: boolean; onDone?: () => void }) {
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const send = useMutation({
    mutationFn: () => postComment(q.id, body, tags, parentId),
    onSuccess: () => {
      setBody(""); setTags([]);
      toast.success(parentId ? "Reply sent 💬" : "Said what you said 💅");
      qc.invalidateQueries({ queryKey: ["comments", q.id] });
      onDone?.();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const reply = !!parentId;
  return (
    <div className={cn("rounded-2xl p-4 brut", reply ? "mt-2 bg-card" : "mt-4 bg-lime")}>
      {!reply && (
        <div className="mb-3 flex flex-wrap gap-2">
          {FEEDBACK_TAGS.map((t) => (
            <Chip key={t} active={tags.includes(t)} onClick={() => setTags(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t])}>{t}</Chip>
          ))}
        </div>
      )}
      <Textarea
        className="min-h-16 rounded-xl bg-card"
        placeholder={reply ? "Clap back (nicely)…" : "Why tho? Spill it."}
        maxLength={COMMENT_LIMIT}
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-xs font-bold">{body.length}/{COMMENT_LIMIT}</span>
        <Button variant="hero" className="h-10 px-5" disabled={send.isPending || (!body.trim() && !tags.length)} onClick={() => send.mutate()}>
          {reply ? "Reply" : "Post"}
        </Button>
      </div>
      {!signedIn && !reply && (
        <p className="mt-3 text-xs font-bold">
          Posting as anon 👻 <Link to="/auth" className="underline">Sign up</Link> to collect points when people react.
        </p>
      )}
    </div>
  );
}

function CommentItem({ c, q, tilt, isOwner, signedIn, isReply }: {
  c: Comment; q: Question; tilt: number; isOwner: boolean; signedIn: boolean; isReply?: boolean;
}) {
  const qc = useQueryClient();
  const [replying, setReplying] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: ["comments", q.id] });
  const react = useMutation({ mutationFn: (e: string) => toggleReaction(c.id, e), onSuccess: refresh, onError: (e: Error) => toast.error(e.message) });
  const hide = useMutation({
    mutationFn: () => setCommentHidden(c.id, !c.hidden),
    onSuccess: () => { toast.success(c.hidden ? "Back on display 👀" : "Hidden. Bye 👋"); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div>
      <div className={cn("rounded-xl bg-card px-4 py-3 brut-sm", tilt > 0 ? "rotate-[0.4deg]" : "rotate-[-0.4deg]", c.hidden && "opacity-50")}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-extrabold">{c.author}</span>
          <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-extrabold uppercase brut-sm", OPTION_COLORS[c.choice], c.choice === "a" || c.choice === "c" ? "tilt-l" : "tilt-r")}>
            {q.kind === "buyskip" ? (c.choice === "a" ? "Team Buy" : "Team Skip") : `Team ${c.choice.toUpperCase()}`}
          </span>
          {c.hidden && <span className="text-[10px] font-extrabold uppercase">hidden</span>}
          <span className="ml-auto flex items-center gap-2">
            {isOwner && (
              <button type="button" onClick={() => hide.mutate()} aria-label={c.hidden ? "Unhide comment" : "Hide comment"} className="text-muted-foreground">
                {c.hidden ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
              </button>
            )}
            <ReportButton questionId={q.id} compact label="Report comment" onReport={(r, d) => reportComment(c.id, r, d)} />
          </span>
        </div>
        {c.body && <p className="mt-1.5 break-words text-sm font-medium">{c.body}</p>}
        {c.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {c.tags.map((t) => <span key={t} className="rounded-md bg-primary px-2 py-0.5 text-[11px] font-extrabold brut-sm">{t}</span>)}
          </div>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-1">
        {REACTIONS.map((e) => {
          const n = c.reactions[e] ?? 0;
          const mine = c.myReaction === e;
          return (
            <button
              key={e}
              type="button"
              disabled={react.isPending}
              onClick={() => react.mutate(e)}
              aria-pressed={mine}
              aria-label={`React ${e}`}
              className={cn("rounded-full px-2 py-0.5 text-xs font-extrabold brut-sm press", mine ? "bg-yellow" : "bg-card", !n && !mine && "opacity-60")}
            >
              {e}{n > 0 && <span className="ml-1">{n}</span>}
            </button>
          );
        })}
        {!isReply && (
          <button type="button" onClick={() => setReplying(!replying)} className="ml-1 inline-flex items-center gap-1 text-xs font-extrabold">
            <Reply className="size-3.5" /> Reply
          </button>
        )}
      </div>
      {replying && <div className="ml-6"><Composer q={q} parentId={c.id} signedIn={signedIn} onDone={() => setReplying(false)} /></div>}
      {c.replies.length > 0 && (
        <ul className="ml-6 mt-3 space-y-3 border-l-2 pl-3">
          {c.replies.map((r, i) => (
            <li key={r.id}><CommentItem c={r} q={q} tilt={i % 2 ? -1 : 1} isOwner={isOwner} signedIn={signedIn} isReply /></li>
          ))}
        </ul>
      )}
    </div>
  );
}
