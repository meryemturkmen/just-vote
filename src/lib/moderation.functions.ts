import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const BUCKET = "question-images";
const MAX_B64 = 4_000_000; // ~3MB per image after compression
const DAILY_LIMIT = 10;

const img = z.string().min(100).max(MAX_B64).regex(/^[A-Za-z0-9+/=]+$/);

export class ModerationBlocked extends Error {}

async function moderate(images: string[]): Promise<{ allowed: boolean; reason: string }> {
  const { generateMessage } = await import("@lovable.dev/ai-gateway");
  const res = await generateMessage({
    model: "anthropic/claude-haiku-4-5",
    max_tokens: 200,
    system:
      "You are an image safety classifier for a shopping-decision app used by teens (16+). " +
      "Block images containing nudity, sexual content, exposed genitals or breasts, gore, blood, violence, weapons pointed at people, self-harm, or hateful symbols. " +
      "Products like underwear, swimwear, knives in packaging or clothes on mannequins are fine. " +
      'Reply ONLY with JSON: {"allowed": true|false, "reason": "<short>"}',
    messages: [
      {
        role: "user",
        content: [
          ...images.map((data) => ({
            type: "image" as const,
            source: { type: "base64" as const, media_type: "image/jpeg" as const, data },
          })),
          { type: "text" as const, text: "Classify all images together. Block if ANY image is unsafe." },
        ],
      },
    ],
  });
  const text = res.content.map((c) => ("text" in c ? c.text : "")).join("");
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return { allowed: false, reason: "unclear" };
  try {
    const j = JSON.parse(m[0]) as { allowed?: boolean; reason?: string };
    return { allowed: j.allowed === true, reason: j.reason ?? "" };
  } catch {
    return { allowed: false, reason: "unclear" };
  }
}

function toBytes(b64: string) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Checks the daily question limit, runs AI image moderation, then stores the 1-4 photos. */
export const uploadQuestionPhotos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ images: z.array(img).min(1).max(4) }).parse(d))
  .handler(async ({ data, context }) => {
    const uid = context.userId;
    const since = new Date(Date.now() - 86400000).toISOString();
    const { count } = await context.supabase
      .from("questions").select("id", { count: "exact", head: true })
      .eq("user_id", uid).gte("created_at", since);
    if ((count ?? 0) >= DAILY_LIMIT) return { ok: false as const, error: "limit" as const };

    let verdict;
    try {
      verdict = await moderate(data.images);
    } catch (e) {
      console.error("moderation failed", e);
      return { ok: false as const, error: "moderation_unavailable" as const };
    }
    if (!verdict.allowed) return { ok: false as const, error: "blocked" as const };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const paths: string[] = [];
    for (const b64 of data.images) {
      const path = `${uid}/${crypto.randomUUID()}.jpg`;
      const { error } = await supabaseAdmin.storage.from(BUCKET).upload(path, toBytes(b64), { contentType: "image/jpeg" });
      if (error) throw new Error(error.message);
      paths.push(path);
    }
    return { ok: true as const, paths };
  });

/** Stores the link-preview image for a question the caller owns. */
export const uploadPreviewImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ questionId: z.string().uuid(), og: img }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: q } = await context.supabase.from("questions").select("id, user_id").eq("id", data.questionId).maybeSingle();
    if (!q || q.user_id !== context.userId) throw new Error("Not your question");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.storage.from(BUCKET)
      .upload(`${q.user_id}/${q.id}-og.jpg`, toBytes(data.og), { contentType: "image/jpeg", upsert: true });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Admin only: delete a question and its photos. */
export const adminDeleteQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: q } = await supabaseAdmin.from("questions").select("id, user_id, option_a_image, option_b_image, option_c_image, option_d_image").eq("id", data.id).maybeSingle();
    if (!q) return { ok: true };
    await supabaseAdmin.storage.from(BUCKET).remove([q.option_a_image, q.option_b_image, q.option_c_image, q.option_d_image, `${q.user_id}/${q.id}-og.jpg`].filter((x): x is string => !!x));
    const { error } = await supabaseAdmin.from("questions").delete().eq("id", q.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
