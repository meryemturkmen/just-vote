export const CATEGORIES = [
  "Tech",
  "Fashion",
  "Shoes",
  "Bags",
  "Beauty",
  "Home & Living",
  "Sports & Outdoor",
  "Kitchen",
  "Gaming",
  "Books & Hobbies",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export function isCategory(v: unknown): v is Category {
  return typeof v === "string" && (CATEGORIES as readonly string[]).includes(v);
}

/** Toggle a category in a multi-select; never lets the selection become empty. */
export function toggleInterest(current: string[], c: string): string[] {
  if (current.includes(c)) {
    return current.length > 1 ? current.filter((x) => x !== c) : current;
  }
  return [...current, c];
}
