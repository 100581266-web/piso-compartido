export type ExpenseInput = {
  paidBy: string;
  amountCents: number;
};

export type ExpenseShareInput = {
  userId: string;
  shareCents: number;
};

export type SettlementInput = {
  fromUserId: string;
  toUserId: string;
  amountCents: number;
};

export type Transaction = {
  from: string;
  to: string;
  amountCents: number;
};

/**
 * Splits an amount equally among users using integer cents only, giving the
 * leftover cents (from the division remainder) to the first users in the
 * list so the shares always sum back to exactly amountCents.
 */
export function splitEqually(
  amountCents: number,
  userIds: string[]
): ExpenseShareInput[] {
  const n = userIds.length;
  const base = Math.floor(amountCents / n);
  const remainder = amountCents - base * n;

  return userIds.map((userId, i) => ({
    userId,
    shareCents: base + (i < remainder ? 1 : 0),
  }));
}

/**
 * Rescales shares to a new total while preserving each user's relative
 * proportion, using the largest-remainder method so the result always sums
 * back to exactly newTotalCents (integer cents only, no floats leaking out).
 */
export function scaleShares(
  shares: ExpenseShareInput[],
  newTotalCents: number
): ExpenseShareInput[] {
  const oldTotal = shares.reduce((sum, s) => sum + s.shareCents, 0);
  if (oldTotal === 0) {
    return splitEqually(
      newTotalCents,
      shares.map((s) => s.userId)
    );
  }

  const floored = shares.map((s) => {
    const exact = (s.shareCents * newTotalCents) / oldTotal;
    return { userId: s.userId, shareCents: Math.floor(exact), remainder: exact - Math.floor(exact) };
  });

  const allocated = floored.reduce((sum, f) => sum + f.shareCents, 0);
  const remaining = newTotalCents - allocated;

  const byRemainder = [...floored].sort((a, b) => b.remainder - a.remainder);
  for (let i = 0; i < remaining; i++) {
    byRemainder[i % byRemainder.length].shareCents += 1;
  }

  return floored.map((f) => ({ userId: f.userId, shareCents: f.shareCents }));
}

/**
 * Net balance per user: positive means the household owes them money,
 * negative means they owe the household money.
 */
export function computeBalances(
  expenses: ExpenseInput[],
  shares: ExpenseShareInput[],
  settlements: SettlementInput[]
): Map<string, number> {
  const balances = new Map<string, number>();

  const add = (userId: string, delta: number) => {
    balances.set(userId, (balances.get(userId) ?? 0) + delta);
  };

  for (const expense of expenses) {
    add(expense.paidBy, expense.amountCents);
  }

  for (const share of shares) {
    add(share.userId, -share.shareCents);
  }

  for (const settlement of settlements) {
    add(settlement.fromUserId, settlement.amountCents);
    add(settlement.toUserId, -settlement.amountCents);
  }

  return balances;
}

/**
 * Greedy debtor/creditor matching: reduces "who owes what" to at most n-1
 * transactions by always settling the largest debtor against the largest
 * creditor first.
 */
export function simplifyDebts(balances: Map<string, number>): Transaction[] {
  const debtors: { userId: string; amountCents: number }[] = [];
  const creditors: { userId: string; amountCents: number }[] = [];

  for (const [userId, amountCents] of balances) {
    if (amountCents < 0) debtors.push({ userId, amountCents: -amountCents });
    else if (amountCents > 0) creditors.push({ userId, amountCents });
  }

  debtors.sort((a, b) => b.amountCents - a.amountCents);
  creditors.sort((a, b) => b.amountCents - a.amountCents);

  const transactions: Transaction[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(debtor.amountCents, creditor.amountCents);

    if (amount > 0) {
      transactions.push({ from: debtor.userId, to: creditor.userId, amountCents: amount });
    }

    debtor.amountCents -= amount;
    creditor.amountCents -= amount;

    if (debtor.amountCents === 0) i++;
    if (creditor.amountCents === 0) j++;
  }

  return transactions;
}
