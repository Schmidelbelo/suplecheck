import { describe, expect, it } from "vitest";
import { formatRelativeDay } from "./format";

const DAY_MS = 1000 * 60 * 60 * 24;

describe("formatRelativeDay", () => {
  it("returns 'hoje' for a timestamp earlier the same calendar day", () => {
    const now = new Date(2026, 0, 15, 20, 0, 0).getTime();
    const earlierToday = new Date(2026, 0, 15, 8, 0, 0).getTime();
    expect(formatRelativeDay(earlierToday, now)).toBe("hoje");
  });

  it("returns 'ontem' for yesterday even across the midnight boundary", () => {
    const now = new Date(2026, 0, 15, 1, 0, 0).getTime();
    const lateLastNight = new Date(2026, 0, 14, 23, 0, 0).getTime();
    expect(formatRelativeDay(lateLastNight, now)).toBe("ontem");
  });

  it("returns 'há X dias' for older visits", () => {
    const now = Date.now();
    const fiveDaysAgo = now - 5 * DAY_MS;
    expect(formatRelativeDay(fiveDaysAgo, now)).toBe("há 5 dias");
  });
});
