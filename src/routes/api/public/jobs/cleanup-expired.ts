import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

const RETENTION_DAYS = 30;
const BUCKET = "question-images";

// Daily: delete questions (and their photos) that closed more than 30 days ago.
export const Route = createFileRoute("/api/public/jobs/cleanup-expired")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authFailure = await authenticateCronRequest(request);
        if (authFailure) return authFailure;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const cutoff = new Date(Date.now() - RETENTION_DAYS * 86400000).toISOString();
        let deleted = 0;

        for (let i = 0; i < 20; i++) {
          const { data, error } = await supabaseAdmin
            .from("questions")
            .select("id, user_id, option_a_image, option_b_image")
            .lt("ends_at", cutoff)
            .limit(100);
          if (error) return Response.json({ error: error.message }, { status: 500 });
          if (!data.length) break;

          const paths = data.flatMap((q) => [q.option_a_image, q.option_b_image, `${q.user_id}/${q.id}-og.jpg`]).filter(Boolean);
          if (paths.length) {
            const { error: se } = await supabaseAdmin.storage.from(BUCKET).remove(paths);
            if (se) return Response.json({ error: se.message }, { status: 500 });
          }
          const { error: de } = await supabaseAdmin.from("questions").delete().in("id", data.map((q) => q.id));
          if (de) return Response.json({ error: de.message }, { status: 500 });
          deleted += data.length;
        }

        return Response.json({ success: true, deleted });
      },
    },
  },
});
