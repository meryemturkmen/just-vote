/** Playful line after voting, based on how many people picked the same side. */
export function verdictLine(myPct: number, total: number): string {
  if (total <= 1) return "You're the first. Trendsetter 😎";
  if (myPct === 50) return "Literally 50/50. Pure chaos 🌀";
  if (myPct >= 75) return `Main character energy. ${myPct}% agree 🤝`;
  if (myPct > 50) return `Majority vibes. ${myPct}% are with you ✌️`;
  if (myPct <= 25) return `Hot take: only ${myPct}% agree with you 🌶️`;
  return `Bold. Only ${myPct}% picked this one 👀`;
}

export function myShare(choice: "a" | "b", pa: number, pb: number) {
  return choice === "a" ? pa : pb;
}
