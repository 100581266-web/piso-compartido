import { describe, expect, it } from "vitest";
import { nextAssignee, nextDueDate, projectChoreOccurrences } from "./chore-rotation";

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

describe("projectChoreOccurrences", () => {
  const order = ["a", "b", "c"];

  it("projects forward until the given date, cycling assignees", () => {
    const occurrences = projectChoreOccurrences(
      order,
      7,
      "a",
      new Date(2026, 0, 1),
      new Date(2026, 0, 22)
    );

    expect(occurrences.map((o) => [ymd(o.date), o.assignedTo])).toEqual([
      ["2026-01-01", "a"],
      ["2026-01-08", "b"],
      ["2026-01-15", "c"],
      ["2026-01-22", "a"],
    ]);
  });

  it("returns just the first occurrence when until is before the second", () => {
    const occurrences = projectChoreOccurrences(
      order,
      7,
      "a",
      new Date(2026, 0, 1),
      new Date(2026, 0, 5)
    );
    expect(occurrences).toHaveLength(1);
    expect(occurrences[0].assignedTo).toBe("a");
  });

  it("returns nothing when the first date is already after until", () => {
    const occurrences = projectChoreOccurrences(
      order,
      7,
      "a",
      new Date(2026, 1, 1),
      new Date(2026, 0, 1)
    );
    expect(occurrences).toHaveLength(0);
  });
});
