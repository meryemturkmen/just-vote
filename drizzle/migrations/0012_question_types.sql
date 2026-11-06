ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'ab';
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS option_c_image text;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS option_d_image text;
ALTER TABLE public.questions ADD CONSTRAINT questions_kind_check CHECK (kind IN ('ab','multi','buyskip'));
ALTER TABLE public.questions ADD CONSTRAINT questions_kind_photos_check CHECK (
  (kind = 'multi' AND option_c_image IS NOT NULL) OR (kind <> 'multi' AND option_c_image IS NULL AND option_d_image IS NULL)
);
ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_decided_choice_check;
ALTER TABLE public.questions ADD CONSTRAINT questions_decided_choice_check CHECK (decided_choice IS NULL OR decided_choice IN ('a','b','c','d','neither'));
ALTER TABLE public.votes DROP CONSTRAINT IF EXISTS votes_choice_check;
ALTER TABLE public.votes ADD CONSTRAINT votes_choice_check CHECK (choice IN ('a','b','c','d'));
ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_choice_check;
ALTER TABLE public.comments ADD CONSTRAINT comments_choice_check CHECK (choice IN ('a','b','c','d'));

CREATE OR REPLACE FUNCTION public.question_has_choice(p_question uuid, p_choice text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.questions q WHERE q.id = p_question AND (
    p_choice IN ('a','b')
    OR (p_choice = 'c' AND q.option_c_image IS NOT NULL)
    OR (p_choice = 'd' AND q.option_d_image IS NOT NULL)))
$$;

CREATE OR REPLACE FUNCTION public.ensure_vote_choice()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.question_has_choice(NEW.question_id, NEW.choice) THEN
    RAISE EXCEPTION 'Invalid choice for this question';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS votes_valid_choice ON public.votes;
CREATE TRIGGER votes_valid_choice BEFORE INSERT ON public.votes FOR EACH ROW EXECUTE FUNCTION public.ensure_vote_choice();

CREATE OR REPLACE FUNCTION public.decide_question(p_question uuid, p_choice text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_choice <> 'neither' AND NOT public.question_has_choice(p_question, p_choice) THEN RAISE EXCEPTION 'Invalid choice'; END IF;
  UPDATE public.questions
     SET decided_choice = p_choice,
         decided_at = now(),
         ends_at = LEAST(COALESCE(ends_at, now()), now())
   WHERE id = p_question AND user_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Question not found'; END IF;
END $$;