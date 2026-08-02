import { describe, expect, it } from "vitest";
import { nextAssignee, nextDueDate } from "./chore-rotation";

describe("nextAssignee", () => {
  const order = ["a", "b", "c"];

  it("moves to the next person in order", () => {
    expect(nextAssignee(order, "a")).toBe("b");
    expect(nextAssignee(order, "b")).toBe("c");
  });

  it("wraps around back to the start", () => {
    expect(nextAssignee(order, "c")).toBe("a");
  });

  it("restarts from the beginning if the current assignee left the household", () => {
    expect(nextAssignee(["a", "c"], "b")).toBe("a");
  });

  it("throws when there is nobody left in the rotation", () => {
    expect(() => nextAssignee([], "a")).toThrow();
  });
});

function ymd(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

describe("nextDueDate", () => {
  it("adds the recurrence in days", () => {
    const result = nextDueDate(new Date(2026, 0, 1), 7);
    expect(ymd(result)).toBe("2026-01-08");
  });

  it("rolls over month boundaries correctly", () => {
    const result = nextDueDate(new Date(2026, 0, 28), 7);
    expect(ymd(result)).toBe("2026-02-04");
  });
});
