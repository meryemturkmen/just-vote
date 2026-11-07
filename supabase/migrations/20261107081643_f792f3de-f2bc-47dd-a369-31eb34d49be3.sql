REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_voting_open() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_vote() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_question_ends_at() FROM PUBLIC, anon, authenticated;