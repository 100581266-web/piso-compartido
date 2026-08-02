import { describe, expect, it } from "vitest";
import { computeBalances, simplifyDebts, splitEqually } from "./debt-simplify";

describe("splitEqually", () => {
  it("splits evenly when it divides cleanly", () => {
    expect(splitEqually(300, ["a", "b", "c"])).toEqual([
      { userId: "a", shareCents: 100 },
      { userId: "b", shareCents: 100 },
      { userId: "c", shareCents: 100 },
    ]);
  });

  it("gives leftover cents to the first users and always sums to the total", () => {
    const shares = splitEqually(1000, ["a", "b", "c"]);
    expect(shares).toEqual([
      { userId: "a", shareCents: 334 },
      { userId: "b", shareCents: 333 },
      { userId: "c", shareCents: 333 },
    ]);
    expect(shares.reduce((sum, s) => sum + s.shareCents, 0)).toBe(1000);
  });
});

describe("computeBalances", () => {
  it("nets out who paid vs who owes, ignoring the payer's own share", () => {
    // A pays 3000 for a shared expense split equally among A, B, C (1000 each)
    const balances = computeBalances(
      [{ paidBy: "a", amountCents: 3000 }],
      [
        { userId: "a", shareCents: 1000 },
        { userId: "b", shareCents: 1000 },
        { userId: "c", shareCents: 1000 },
      ],
      []
    );

    expect(balances.get("a")).toBe(2000);
    expect(balances.get("b")).toBe(-1000);
    expect(balances.get("c")).toBe(-1000);
  });

  it("applies settlements to move balances toward zero", () => {
    const balances = computeBalances(
      [{ paidBy: "a", amountCents: 2000 }],
      [
        { userId: "a", shareCents: 1000 },
        { userId: "b", shareCents: 1000 },
      ],
      [{ fromUserId: "b", toUserId: "a", amountCents: 1000 }]
    );

    expect(balances.get("a")).toBe(0);
    expect(balances.get("b")).toBe(0);
  });
});

describe("simplifyDebts", () => {
  it("produces a single transaction for a simple two-person debt", () => {
    const balances = new Map([
      ["a", 1000],
      ["b", -1000],
    ]);

    expect(simplifyDebts(balances)).toEqual([{ from: "b", to: "a", amountCents: 1000 }]);
  });

  it("never produces more than n-1 transactions for n people", () => {
    // a is owed by everyone, b/c/d each owe a bit
    const balances = new Map([
      ["a", 600],
      ["b", -200],
      ["c", -150],
      ["d", -250],
    ]);

    const transactions = simplifyDebts(balances);
    expect(transactions.length).toBeLessThanOrEqual(3);

    // and the net effect must match the original balances exactly
    const net = new Map<string, number>();
    for (const t of transactions) {
      net.set(t.from, (net.get(t.from) ?? 0) + t.amountCents);
      net.set(t.to, (net.get(t.to) ?? 0) - t.amountCents);
    }
    expect(net.get("a")).toBe(-600);
    expect(net.get("b")).toBe(200);
    expect(net.get("c")).toBe(150);
    expect(net.get("d")).toBe(250);
  });

  it("ignores users who are already settled", () => {
    const balances = new Map([
      ["a", 0],
      ["b", 500],
      ["c", -500],
    ]);

    const transactions = simplifyDebts(balances);
    expect(transactions).toEqual([{ from: "c", to: "b", amountCents: 500 }]);
  });

  it("returns no transactions when everyone is even", () => {
    const balances = new Map([
      ["a", 0],
      ["b", 0],
    ]);

    expect(simplifyDebts(balances)).toEqual([]);
  });
});
