ALTER TABLE public.questions ALTER COLUMN title SET DEFAULT '';
ALTER TABLE public.questions ALTER COLUMN option_a_label SET DEFAULT 'Option A';
ALTER TABLE public.questions ALTER COLUMN option_b_label SET DEFAULT 'Option B';
ALTER TABLE public.questions ADD COLUMN occasion text;
ALTER TABLE public.questions ADD COLUMN budget text;
ALTER TABLE public.questions ADD COLUMN visibility text NOT NULL DEFAULT 'public';
ALTER TABLE public.questions ADD CONSTRAINT questions_visibility_check CHECK (visibility IN ('public','link'));
ALTER TABLE public.questions ADD COLUMN duration_hours integer NOT NULL DEFAULT 24;
ALTER TABLE public.questions ADD CONSTRAINT questions_duration_check CHECK (duration_hours IN (1,24,72));
ALTER TABLE public.questions ADD COLUMN ends_at timestamptz;
UPDATE public.questions SET ends_at = created_at + interval '24 hours' WHERE ends_at IS NULL;

CREATE OR REPLACE FUNCTION public.set_question_ends_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.ends_at := COALESCE(NEW.created_at, now()) + make_interval(hours => NEW.duration_hours);
  RETURN NEW;
END; $$;
CREATE TRIGGER questions_set_ends_at BEFORE INSERT ON public.questions FOR EACH ROW EXECUTE FUNCTION public.set_question_ends_at();

CREATE OR REPLACE FUNCTION public.ensure_voting_open()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.questions WHERE id = NEW.question_id AND ends_at IS NOT NULL AND ends_at < now()) THEN
    RAISE EXCEPTION 'Voting has ended for this question';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER votes_ensure_open BEFORE INSERT OR UPDATE ON public.votes FOR EACH ROW EXECUTE FUNCTION public.ensure_voting_open();