import { describe, expect, it } from "vitest";
import { daysLate } from "./format";

describe("daysLate", () => {
  it("returns 0 when completed exactly on the due date", () => {
    expect(daysLate("2026-01-10", "2026-01-10T18:30:00.000Z")).toBe(0);
  });

  it("returns a negative number when completed early", () => {
    expect(daysLate("2026-01-10", "2026-01-08T09:00:00.000Z")).toBe(-2);
  });

  it("returns a positive number of days when completed late", () => {
    expect(daysLate("2026-01-10", "2026-01-13T09:00:00.000Z")).toBe(3);
  });
});
