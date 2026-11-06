-- Public profile fields
ALTER TABLE public.profiles ADD COLUMN username text;
ALTER TABLE public.profiles ADD COLUMN avatar_emoji text NOT NULL DEFAULT '😎';
ALTER TABLE public.profiles ADD COLUMN avatar_color text NOT NULL DEFAULT 'yellow';
UPDATE public.profiles SET username =
  left(COALESCE(NULLIF(regexp_replace(lower(COALESCE(display_name,'')), '[^a-z0-9_]', '', 'g'), ''), 'voter'), 14) || substr(replace(id::text,'-',''), 1, 4);
CREATE UNIQUE INDEX profiles_username_key ON public.profiles (lower(username));
ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_format CHECK (username IS NULL OR username ~ '^[a-z0-9_]{3,20}$') NOT VALID;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_avatar_color_check CHECK (avatar_color IN ('yellow','pink','lime','card'));
ALTER TABLE public.profiles ADD CONSTRAINT profiles_avatar_emoji_len CHECK (char_length(avatar_emoji) BETWEEN 1 AND 8);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n text;
BEGIN
  n := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
  INSERT INTO public.profiles (id, display_name, username)
  VALUES (NEW.id, n,
    left(COALESCE(NULLIF(regexp_replace(lower(COALESCE(n,'')), '[^a-z0-9_]', '', 'g'), ''), 'voter'), 14) || substr(replace(NEW.id::text,'-',''), 1, 4));
  RETURN NEW;
END; $$;

-- Follows
CREATE TABLE public.follows (
  follower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  followee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, followee_id),
  CHECK (follower_id <> followee_id)
);
CREATE INDEX follows_followee_idx ON public.follows (followee_id);
GRANT SELECT ON public.follows TO anon;
GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
GRANT ALL ON public.follows TO service_role;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Follows readable" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users follow" ON public.follows FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users unfollow" ON public.follows FOR DELETE TO authenticated USING (auth.uid() = follower_id);

-- Crews
CREATE TABLE public.crews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 40),
  emoji text NOT NULL DEFAULT '🫂',
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invite_code text NOT NULL UNIQUE DEFAULT substr(replace(gen_random_uuid()::text,'-',''), 1, 10),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.crew_members (
  crew_id uuid NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (crew_id, user_id)
);
CREATE INDEX crew_members_user_idx ON public.crew_members (user_id);
GRANT SELECT, UPDATE, DELETE ON public.crews TO authenticated;
GRANT ALL ON public.crews TO service_role;
GRANT SELECT, DELETE ON public.crew_members TO authenticated;
GRANT ALL ON public.crew_members TO service_role;

CREATE OR REPLACE FUNCTION public.is_crew_member(_crew uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.crew_members WHERE crew_id = _crew AND user_id = _user)
$$;

ALTER TABLE public.crews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read crews" ON public.crews FOR SELECT TO authenticated USING (public.is_crew_member(id, auth.uid()));
CREATE POLICY "Owner updates crew" ON public.crews FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner deletes crew" ON public.crews FOR DELETE TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Members read members" ON public.crew_members FOR SELECT TO authenticated USING (public.is_crew_member(crew_id, auth.uid()));
CREATE POLICY "Leave or kick" ON public.crew_members FOR DELETE TO authenticated USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.crews c WHERE c.id = crew_id AND c.owner_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.create_crew(p_name text, p_emoji text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cid uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
  IF public.has_profanity(p_name) THEN RAISE EXCEPTION 'profanity'; END IF;
  IF (SELECT count(*) FROM public.crews WHERE owner_id = auth.uid()) >= 20 THEN RAISE EXCEPTION 'Too many crews'; END IF;
  INSERT INTO public.crews (name, emoji, owner_id) VALUES (trim(p_name), COALESCE(NULLIF(p_emoji,''),'🫂'), auth.uid()) RETURNING id INTO cid;
  INSERT INTO public.crew_members (crew_id, user_id) VALUES (cid, auth.uid());
  RETURN cid;
END; $$;

CREATE OR REPLACE FUNCTION public.crew_preview(p_code text)
RETURNS TABLE(id uuid, name text, emoji text, members integer, is_member boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, c.name, c.emoji,
    (SELECT count(*)::int FROM public.crew_members m WHERE m.crew_id = c.id),
    public.is_crew_member(c.id, auth.uid())
  FROM public.crews c WHERE c.invite_code = p_code
$$;

CREATE OR REPLACE FUNCTION public.join_crew(p_code text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cid uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
  SELECT id INTO cid FROM public.crews WHERE invite_code = p_code;
  IF cid IS NULL THEN RAISE EXCEPTION 'Invite link is invalid'; END IF;
  INSERT INTO public.crew_members (crew_id, user_id) VALUES (cid, auth.uid()) ON CONFLICT DO NOTHING;
  RETURN cid;
END; $$;

CREATE OR REPLACE FUNCTION public.reset_crew_invite(p_crew uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE code text := substr(replace(gen_random_uuid()::text,'-',''), 1, 10);
BEGIN
  UPDATE public.crews SET invite_code = code WHERE id = p_crew AND owner_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Only the crew owner can do that'; END IF;
  RETURN code;
END; $$;

-- Crew questions
ALTER TABLE public.questions ADD COLUMN crew_id uuid REFERENCES public.crews(id) ON DELETE CASCADE;
CREATE INDEX questions_crew_idx ON public.questions (crew_id, created_at DESC);
ALTER TABLE public.questions DROP CONSTRAINT questions_visibility_check;
ALTER TABLE public.questions ADD CONSTRAINT questions_visibility_check CHECK (visibility IN ('public','link','crew'));
ALTER TABLE public.questions ADD CONSTRAINT questions_crew_consistency CHECK ((visibility = 'crew') = (crew_id IS NOT NULL));

DROP POLICY "Visible questions viewable by all" ON public.questions;
CREATE POLICY "Visible questions viewable by all" ON public.questions FOR SELECT USING (
  (NOT hidden AND (crew_id IS NULL OR public.is_crew_member(crew_id, auth.uid())))
  OR auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
DROP POLICY "Users create own questions" ON public.questions;
CREATE POLICY "Users create own questions" ON public.questions FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = user_id AND (crew_id IS NULL OR public.is_crew_member(crew_id, auth.uid())));

CREATE OR REPLACE FUNCTION public.ensure_crew_vote()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cid uuid;
BEGIN
  SELECT crew_id INTO cid FROM public.questions WHERE id = NEW.question_id;
  IF cid IS NOT NULL AND (auth.uid() IS NULL OR NOT public.is_crew_member(cid, auth.uid())) THEN
    RAISE EXCEPTION 'Crew members only';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER votes_crew_only BEFORE INSERT ON public.votes FOR EACH ROW EXECUTE FUNCTION public.ensure_crew_vote();
CREATE TRIGGER comments_crew_only BEFORE INSERT ON public.comments FOR EACH ROW EXECUTE FUNCTION public.ensure_crew_vote();

-- Public profile
CREATE OR REPLACE FUNCTION public.public_profile(p_username text)
RETURNS TABLE(id uuid, username text, display_name text, avatar_emoji text, avatar_color text,
  top_categories text[], followers integer, following integer, week_points integer, votes integer, i_follow boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.username, p.display_name, p.avatar_emoji, p.avatar_color,
    COALESCE((SELECT array_agg(category) FROM (
      SELECT q.category FROM public.votes v JOIN public.questions q ON q.id = v.question_id
      WHERE v.user_id = p.id GROUP BY q.category ORDER BY count(*) DESC, q.category LIMIT 3) t),
      p.interests[1:3]),
    (SELECT count(*)::int FROM public.follows f WHERE f.followee_id = p.id),
    (SELECT count(*)::int FROM public.follows f WHERE f.follower_id = p.id),
    COALESCE((SELECT sum(delta)::int FROM public.points_ledger l WHERE l.user_id = p.id
      AND l.reason IN ('vote','vote_interest','reaction','reaction_removed') AND l.created_at > now() - interval '7 days'), 0),
    (SELECT count(*)::int FROM public.votes v WHERE v.user_id = p.id),
    EXISTS (SELECT 1 FROM public.follows f WHERE f.follower_id = auth.uid() AND f.followee_id = p.id)
  FROM public.profiles p WHERE lower(p.username) = lower(p_username)
$$;

-- Weekly leaderboard
CREATE OR REPLACE FUNCTION public.leaderboard(p_category text, p_scope text DEFAULT 'all')
RETURNS TABLE(user_id uuid, username text, display_name text, avatar_emoji text, avatar_color text, points integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.username, p.display_name, p.avatar_emoji, p.avatar_color, sum(l.delta)::int AS pts
  FROM public.points_ledger l
  JOIN public.profiles p ON p.id = l.user_id
  LEFT JOIN public.questions q ON q.id = l.question_id
  WHERE l.reason IN ('vote','vote_interest','reaction','reaction_removed')
    AND l.created_at > now() - interval '7 days'
    AND (p_category IS NULL OR q.category = p_category)
    AND (p_scope <> 'following' OR p.id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.follows f WHERE f.follower_id = auth.uid() AND f.followee_id = p.id))
  GROUP BY p.id
  HAVING sum(l.delta) > 0
  ORDER BY pts DESC, p.username
  LIMIT 50
$$;

GRANT EXECUTE ON FUNCTION public.public_profile(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.leaderboard(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.crew_preview(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_crew(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_crew(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_crew_invite(uuid) TO authenticated;