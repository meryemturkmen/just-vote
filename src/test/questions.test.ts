import { describe, expect, it } from "vitest";
import { displayTitle, isClosed, timeLeft } from "@/lib/questions";

const now = Date.parse("2026-11-06T12:00:00Z");

describe("voting window", () => {
  it("is closed once ends_at has passed", () => {
    expect(isClosed({ ends_at: "2026-11-06T11:59:00Z" }, now)).toBe(true);
    expect(isClosed({ ends_at: "2026-11-06T13:00:00Z" }, now)).toBe(false);
  });
  it("shows remaining time for 1 hour, 24 hours and 3 days", () => {
    expect(timeLeft("2026-11-06T13:00:00Z", now)).toBe("1h 0m left");
    expect(timeLeft("2026-11-07T12:00:00Z", now)).toBe("1d 0h left");
    expect(timeLeft("2026-11-09T12:00:00Z", now)).toBe("3d 0h left");
    expect(timeLeft("2026-11-06T11:00:00Z", now)).toBe("Voting closed");
  });
  it("falls back to a default title when none is given", () => {
    expect(displayTitle({ title: "  " })).toBe("Which one should I buy?");
  });
});

import { COMMENT_MAX, FEEDBACK_TAGS } from "@/lib/questions";
describe("vote feedback", () => {
  it("offers the five quick tags and a 140-char comment", () => {
    expect([...FEEDBACK_TAGS]).toEqual(["Design", "Quality", "Price", "Style", "Features"]);
    expect(COMMENT_MAX).toBe(140);
  });
});

import { decisionLabel } from "@/lib/questions";
import { notificationText } from "@/lib/notifications";
describe("decisions and notifications", () => {
  it("labels the asker's choice", () => {
    expect(decisionLabel("a")).toBe("Went with A");
    expect(decisionLabel("neither")).toBe("Chose neither");
    expect(decisionLabel(null)).toBeNull();
  });
  it("describes notifications", () => {
    expect(notificationText({ kind: "votes", count: 3 })).toBe("3 new votes");
    expect(notificationText({ kind: "votes", count: 1 })).toBe("1 new vote");
  });
});
