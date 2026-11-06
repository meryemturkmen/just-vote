ALTER TABLE public.questions ADD COLUMN decided_choice text;
ALTER TABLE public.questions ADD CONSTRAINT questions_decided_choice_check CHECK (decided_choice IS NULL OR decided_choice IN ('a','b','neither'));
ALTER TABLE public.questions ADD COLUMN decided_at timestamptz;

-- Owner closes with a decision; only these fields may change.
CREATE OR REPLACE FUNCTION public.decide_question(p_question uuid, p_choice text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_choice NOT IN ('a','b','neither') THEN RAISE EXCEPTION 'Invalid choice'; END IF;
  UPDATE public.questions
     SET decided_choice = p_choice,
         decided_at = now(),
         ends_at = LEAST(COALESCE(ends_at, now()), now())
   WHERE id = p_question AND user_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Question not found'; END IF;
END; $$;
REVOKE EXECUTE ON FUNCTION public.decide_question(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.decide_question(uuid, text) TO authenticated;

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('votes','ended')),
  count integer NOT NULL DEFAULT 1,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX notifications_unread_votes_uniq ON public.notifications (question_id) WHERE kind = 'votes' AND read = false;
CREATE UNIQUE INDEX notifications_ended_uniq ON public.notifications (question_id) WHERE kind = 'ended';
CREATE INDEX notifications_user_idx ON public.notifications (user_id, updated_at DESC);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users mark own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.notify_new_vote()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE owner uuid;
BEGIN
  SELECT user_id INTO owner FROM public.questions WHERE id = NEW.question_id;
  IF owner IS NULL OR owner = NEW.user_id THEN RETURN NEW; END IF;
  INSERT INTO public.notifications (user_id, question_id, kind)
  VALUES (owner, NEW.question_id, 'votes')
  ON CONFLICT (question_id) WHERE kind = 'votes' AND read = false
  DO UPDATE SET count = public.notifications.count + 1, updated_at = now();
  RETURN NEW;
END; $$;
CREATE TRIGGER votes_notify AFTER INSERT ON public.votes FOR EACH ROW EXECUTE FUNCTION public.notify_new_vote();

-- Called by the owner's app to create "ended" notifications for questions whose time ran out.
CREATE OR REPLACE FUNCTION public.sync_ended_notifications()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.notifications (user_id, question_id, kind, created_at, updated_at)
  SELECT q.user_id, q.id, 'ended', q.ends_at, q.ends_at
  FROM public.questions q
  WHERE q.user_id = auth.uid() AND q.ends_at <= now() AND q.decided_at IS NULL
  ON CONFLICT (question_id) WHERE kind = 'ended' DO NOTHING;
$$;
REVOKE EXECUTE ON FUNCTION public.sync_ended_notifications() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.sync_ended_notifications() TO authenticated;