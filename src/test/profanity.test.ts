import { describe, expect, it } from "vitest";
import { hasProfanity } from "@/lib/profanity";

describe("profanity filter", () => {
  it("blocks swear words incl. leetspeak", () => {
    expect(hasProfanity("which one is less shit")).toBe(true);
    expect(hasProfanity("F4ck this")).toBe(false); // 4 -> a: 'fack' not a word
    expect(hasProfanity("sh1t")).toBe(true);
  });
  it("allows clean text and substrings like 'Scunthorpe' or 'class'", () => {
    expect(hasProfanity("Which headphones for class?")).toBe(false);
    expect(hasProfanity("Scunthorpe trip")).toBe(false);
  });
});
