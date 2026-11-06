import { describe, expect, it } from "vitest";
import { COMMENT_LIMIT, REACTIONS, sortComments } from "@/lib/comments";

const c = (id: string, reactionTotal: number, created_at: string) => ({ id, reactionTotal, created_at });

describe("comments", () => {
  it("allows max 200 characters and the five fixed reactions", () => {
    expect(COMMENT_LIMIT).toBe(200);
    expect([...REACTIONS]).toEqual(["🔥", "😂", "💯", "👀", "💀"]);
  });
  it("Top sorts by most reactions, New by newest", () => {
    const list = [c("old-hot", 5, "2026-11-01"), c("new-cold", 0, "2026-11-06"), c("mid", 2, "2026-11-03")];
    expect(sortComments(list, "top").map((x) => x.id)).toEqual(["old-hot", "mid", "new-cold"]);
    expect(sortComments(list, "new").map((x) => x.id)).toEqual(["new-cold", "mid", "old-hot"]);
  });
});
