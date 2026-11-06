import { describe, expect, it } from "vitest";
import { CATEGORIES, isCategory, toggleInterest } from "@/lib/categories";

describe("categories", () => {
  it("has exactly the 11 requested categories", () => {
    expect(CATEGORIES).toEqual([
      "Tech", "Fashion", "Shoes", "Bags", "Beauty", "Home & Living",
      "Sports & Outdoor", "Kitchen", "Gaming", "Books & Hobbies", "Other",
    ]);
  });
  it("rejects unknown categories", () => {
    expect(isCategory("Cars")).toBe(false);
    expect(isCategory("Gaming")).toBe(true);
  });
  it("keeps at least one interest selected", () => {
    expect(toggleInterest(["Tech"], "Tech")).toEqual(["Tech"]);
    expect(toggleInterest(["Tech", "Bags"], "Tech")).toEqual(["Bags"]);
    expect(toggleInterest(["Tech"], "Bags")).toEqual(["Tech", "Bags"]);
  });
});
