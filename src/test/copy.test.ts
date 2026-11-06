import { describe, expect, it } from "vitest";
import { verdictLine } from "@/lib/copy";
describe("verdict line", () => {
  it("calls out a minority pick as a hot take with the exact percent", () => {
    expect(verdictLine(12, 50)).toBe("Hot take: only 12% agree with you 🌶️");
  });
  it("celebrates the majority", () => {
    expect(verdictLine(80, 10)).toContain("80% agree");
  });
  it("handles first vote and ties", () => {
    expect(verdictLine(100, 1)).toContain("first");
    expect(verdictLine(50, 4)).toContain("50/50");
  });
});
