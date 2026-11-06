CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

ALTER TABLE public.questions ADD COLUMN hidden boolean NOT NULL DEFAULT false;

DROP POLICY "Questions viewable by all" ON public.questions;
CREATE POLICY "Visible questions viewable by all" ON public.questions FOR SELECT
  USING (NOT hidden OR auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update questions" ON public.questions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete questions" ON public.questions FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
GRANT UPDATE ON public.questions TO authenticated;

GRANT SELECT, DELETE ON public.reports TO authenticated;
CREATE POLICY "Admins read reports" ON public.reports FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete reports" ON public.reports FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Max 10 new questions per user per rolling 24h
CREATE OR REPLACE FUNCTION public.limit_daily_questions()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (SELECT count(*) FROM public.questions WHERE user_id = NEW.user_id AND created_at > now() - interval '24 hours') >= 10 THEN
    RAISE EXCEPTION 'daily_question_limit' USING ERRCODE = 'P0001', HINT = 'Max 10 questions per day';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER questions_daily_limit BEFORE INSERT ON public.questions FOR EACH ROW EXECUTE FUNCTION public.limit_daily_questions();

-- Profanity filter (word-boundary match, case-insensitive, simple leetspeak normalisation)
CREATE OR REPLACE FUNCTION public.has_profanity(t text)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT coalesce(
    translate(lower(t), '013457@$', 'oieastas') ~* '\m(fuck\w*|shit\w*|bitch\w*|cunt\w*|asshole\w*|dick(head)?s?|pussy|whore\w*|slut\w*|bastard\w*|motherfuck\w*|nigg\w*|fag(got)?\w*|retard\w*|wank\w*|twat\w*|cock(sucker)?s?|porn\w*|nazi\w*|kys|scheisse|scheiße|hurensohn|fotze|wichser|arschloch)\M',
    false)
$$;
CREATE OR REPLACE FUNCTION public.block_profane_question()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF public.has_profanity(NEW.title) OR public.has_profanity(NEW.occasion) OR public.has_profanity(NEW.budget) THEN
    RAISE EXCEPTION 'profanity_blocked' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER questions_profanity BEFORE INSERT OR UPDATE OF title, occasion, budget ON public.questions FOR EACH ROW EXECUTE FUNCTION public.block_profane_question();
CREATE OR REPLACE FUNCTION public.block_profane_feedback()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF public.has_profanity(NEW.comment) THEN
    RAISE EXCEPTION 'profanity_blocked' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER feedback_profanity BEFORE INSERT OR UPDATE OF comment ON public.vote_feedback FOR EACH ROW EXECUTE FUNCTION public.block_profane_feedback();

-- Photos must go through the moderated server upload
DROP POLICY "Users upload own question images" ON storage.objects;