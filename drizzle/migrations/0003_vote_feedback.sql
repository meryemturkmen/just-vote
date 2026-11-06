DROP POLICY IF EXISTS "Users change own vote" ON public.votes;
DROP POLICY IF EXISTS "Guests change anonymous vote" ON public.votes;

CREATE TABLE public.vote_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  voter_id uuid NOT NULL,
  anonymous boolean NOT NULL DEFAULT false,
  tags text[] NOT NULL DEFAULT '{}',
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (question_id, voter_id),
  CONSTRAINT vote_feedback_comment_len CHECK (comment IS NULL OR char_length(comment) <= 140),
  CONSTRAINT vote_feedback_tags_valid CHECK (tags <@ ARRAY['Design','Quality','Price','Style','Features']::text[])
);
GRANT SELECT, INSERT ON public.vote_feedback TO anon;
GRANT SELECT, INSERT ON public.vote_feedback TO authenticated;
GRANT ALL ON public.vote_feedback TO service_role;
ALTER TABLE public.vote_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Feedback viewable by all" ON public.vote_feedback FOR SELECT USING (true);
CREATE POLICY "Members add own feedback" ON public.vote_feedback FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = voter_id AND anonymous = false AND EXISTS (SELECT 1 FROM public.votes v WHERE v.question_id = vote_feedback.question_id AND v.user_id = vote_feedback.voter_id));
CREATE POLICY "Guests add anonymous feedback" ON public.vote_feedback FOR INSERT TO anon
  WITH CHECK (anonymous = true AND EXISTS (SELECT 1 FROM public.votes v WHERE v.question_id = vote_feedback.question_id AND v.user_id = vote_feedback.voter_id AND v.anonymous = true));