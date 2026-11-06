CREATE INDEX IF NOT EXISTS questions_feed_idx ON public.questions (visibility, ends_at, created_at DESC);
CREATE INDEX IF NOT EXISTS votes_user_idx ON public.votes (user_id);

CREATE OR REPLACE FUNCTION public.feed_page(
  p_voter uuid,
  p_interests text[],
  p_category text,
  p_sort text,
  p_limit int,
  p_offset int
)
RETURNS TABLE (id uuid, matched boolean)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT q.id,
         (p_interests IS NULL OR q.category = ANY (p_interests)) AS matched
  FROM public.questions q
  WHERE q.visibility = 'public'
    AND (q.ends_at IS NULL OR q.ends_at > now())
    AND (p_category IS NULL OR q.category = p_category)
    AND (auth.uid() IS NULL OR q.user_id <> auth.uid())
    AND (p_voter IS NULL OR NOT EXISTS (SELECT 1 FROM public.votes v WHERE v.question_id = q.id AND v.user_id = p_voter))
  ORDER BY
    (p_interests IS NULL OR q.category = ANY (p_interests)) DESC,
    CASE WHEN p_sort = 'ending' THEN q.ends_at END ASC NULLS LAST,
    q.created_at DESC,
    q.id
  LIMIT LEAST(GREATEST(p_limit, 1), 50) OFFSET GREATEST(p_offset, 0)
$$;
GRANT EXECUTE ON FUNCTION public.feed_page(uuid, text[], text, text, int, int) TO anon, authenticated;