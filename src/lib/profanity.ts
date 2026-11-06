// Mirrors public.has_profanity() in the database (which is the real gate).
const WORDS =
  /\b(fuck\w*|shit\w*|bitch\w*|cunt\w*|asshole\w*|dick(head)?s?|pussy|whore\w*|slut\w*|bastard\w*|motherfuck\w*|nigg\w*|fag(got)?\w*|retard\w*|wank\w*|twat\w*|cock(sucker)?s?|porn\w*|nazi\w*|kys|scheisse|scheiße|hurensohn|fotze|wichser|arschloch)\b/i;

const LEET: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", $: "s" };

export function hasProfanity(text: string | null | undefined) {
  if (!text) return false;
  const norm = text.toLowerCase().replace(/[0134578@$]/g, (c) => LEET[c] ?? c);
  return WORDS.test(norm);
}

export const PROFANITY_MSG = "Whoa, language 🧼 Keep it clean and try again.";

/** Turns database abuse-protection errors into friendly copy. */
export function friendlyDbError(message: string) {
  if (message.includes("profanity_blocked")) return PROFANITY_MSG;
  if (message.includes("daily_question_limit")) return "That's 10 questions today. Chill till tomorrow 😮‍💨";
  if (message.includes("vote_first")) return "Vote first, then spill the tea 🗳️";
  if (message.includes("comment_rate_limit")) return "Slow down, speedrunner 🏎️ Try again in a minute.";
  return message;
}
