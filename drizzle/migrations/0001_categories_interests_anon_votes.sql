ALTER TABLE public.questions ADD COLUMN category text NOT NULL DEFAULT 'Other';
ALTER TABLE public.questions ADD CONSTRAINT questions_category_check CHECK (category IN ('Tech','Fashion','Shoes','Bags','Beauty','Home & Living','Sports & Outdoor','Kitchen','Gaming','Books & Hobbies','Other'));
CREATE INDEX questions_category_idx ON public.questions(category);

ALTER TABLE public.profiles ADD COLUMN interests text[] NOT NULL DEFAULT ARRAY['Tech','Fashion','Shoes','Bags','Beauty','Home & Living','Sports & Outdoor','Kitchen','Gaming','Books & Hobbies','Other'];
ALTER TABLE public.profiles ADD COLUMN onboarded boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_interests_nonempty CHECK (cardinality(interests) >= 1);

ALTER TABLE public.votes ADD COLUMN anonymous boolean NOT NULL DEFAULT false;
GRANT SELECT, INSERT, UPDATE ON public.votes TO anon;
CREATE POLICY "Guests cast anonymous vote" ON public.votes FOR INSERT TO anon WITH CHECK (anonymous = true);
CREATE POLICY "Guests change anonymous vote" ON public.votes FOR UPDATE TO anon USING (anonymous = true) WITH CHECK (anonymous = true);