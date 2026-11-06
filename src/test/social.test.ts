import { describe, expect, it } from "vitest";
import { normalizeUsername, usernameError } from "@/lib/social";

describe("usernames", () => {
  it("accepts 3-20 lowercase letters, digits and underscores", () => {
    expect(usernameError("meryem_99")).toBeNull();
  });
  it("rejects too short, too long and uppercase/special chars", () => {
    expect(usernameError("ab")).not.toBeNull();
    expect(usernameError("a".repeat(21))).not.toBeNull();
    expect(usernameError("hey-you")).not.toBeNull();
  });
  it("normalizes @ and casing", () => {
    expect(normalizeUsername(" @Meryem ")).toBe("meryem");
  });
});
