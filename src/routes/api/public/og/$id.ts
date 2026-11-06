import { createFileRoute } from "@tanstack/react-router";

const BUCKET = "question-images";
const UUID = /^[0-9a-f-]{36}$/i;

// Public link-preview image for crawlers. Serves only the pre-rendered preview of the given question.
export const Route = createFileRoute("/api/public/og/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const fallback = Response.redirect(new URL("/og-default.jpg", request.url).toString(), 302);
        if (!UUID.test(params.id)) return fallback;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: q } = await supabaseAdmin.from("questions").select("id, user_id, crew_id").eq("id", params.id).maybeSingle();
        if (!q) return fallback;
        const { data: file } = await supabaseAdmin.storage.from(BUCKET).download(`${q.user_id}/${q.id}-og.jpg`);
        if (!file) return fallback;
        return new Response(file, {
          headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=86400" },
        });
      },
    },
  },
});
