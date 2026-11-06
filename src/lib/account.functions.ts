import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const BUCKET = "question-images";

/** Permanently delete the caller's account: photos, questions, votes, feedback, points, then the login itself. */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const uid = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Photos (incl. link-preview images) live under the user's folder.
    for (let i = 0; i < 50; i++) {
      const { data: files, error } = await supabaseAdmin.storage.from(BUCKET).list(uid, { limit: 100 });
      if (error) throw new Error(error.message);
      if (!files?.length) break;
      const { error: re } = await supabaseAdmin.storage.from(BUCKET).remove(files.map((f) => `${uid}/${f.name}`));
      if (re) throw new Error(re.message);
    }

    const steps = [
      supabaseAdmin.from("vote_feedback").delete().eq("voter_id", uid),
      supabaseAdmin.from("comments").delete().eq("author_id", uid),
      supabaseAdmin.from("comment_reactions").delete().eq("reactor_id", uid),
      supabaseAdmin.from("votes").delete().eq("user_id", uid),
      supabaseAdmin.from("reports").delete().eq("reporter_id", uid),
      supabaseAdmin.from("notifications").delete().eq("user_id", uid),
      supabaseAdmin.from("questions").delete().eq("user_id", uid),
      supabaseAdmin.from("points_ledger").delete().eq("user_id", uid),
    ];
    for (const s of steps) {
      const { error } = await s;
      if (error) throw new Error(error.message);
    }
    const { error } = await supabaseAdmin.auth.admin.deleteUser(uid);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
