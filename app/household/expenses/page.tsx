import { requireHousehold, getHouseholdMembers } from "@/lib/household";
import { computeBalances, simplifyDebts } from "@/lib/debt-simplify";
import { formatCents } from "@/lib/format";
import { AddExpenseForm } from "./add-expense-form";
import { SettleButton } from "./settle-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ExpensesPage() {
  const { supabase, user, household } = await requireHousehold();
  const members = await getHouseholdMembers(supabase, household.id);
  const nameOf = (userId: string) =>
    members.find((m) => m.userId === userId)?.displayName ?? "—";

  const [{ data: expenses }, { data: shares }, { data: settlements }] = await Promise.all([
    supabase
      .from("expenses")
      .select("id, description, amount_cents, paid_by, expense_date")
      .eq("household_id", household.id)
      .order("expense_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("expense_shares")
      .select("expense_id, user_id, share_cents")
      .eq("household_id", household.id),
    supabase
      .from("settlements")
      .select("from_user_id, to_user_id, amount_cents")
      .eq("household_id", household.id),
  ]);

  const balances = computeBalances(
    (expenses ?? []).map((e) => ({ paidBy: e.paid_by, amountCents: e.amount_cents })),
    (shares ?? []).map((s) => ({ userId: s.user_id, shareCents: s.share_cents })),
    (settlements ?? []).map((s) => ({
      fromUserId: s.from_user_id,
      toUserId: s.to_user_id,
      amountCents: s.amount_cents,
    }))
  );

  const transactions = simplifyDebts(balances);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Añadir gasto</CardTitle>
          <CardDescription>Se reparte a partes iguales entre todos</CardDescription>
        </CardHeader>
        <CardContent>
          <AddExpenseForm householdId={household.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Saldos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {members.map((m) => {
            const amount = balances.get(m.userId) ?? 0;
            return (
              <div key={m.userId} className="flex items-center justify-between text-sm">
                <span>{m.displayName}</span>
                <span
                  className={
                    amount > 0
                      ? "text-green-600"
                      : amount < 0
                        ? "text-destructive"
                        : "text-muted-foreground"
                  }
                >
                  {amount === 0
                    ? "al día"
                    : amount > 0
                      ? `le deben ${formatCents(amount)}`
                      : `debe ${formatCents(-amount)}`}
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Para saldar cuentas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {transactions.map((t) => (
              <div key={`${t.from}-${t.to}`} className="flex items-center justify-between text-sm">
                <span>
                  {nameOf(t.from)} debe {formatCents(t.amountCents)} a {nameOf(t.to)}
                </span>
                {t.from === user.id && (
                  <SettleButton
                    householdId={household.id}
                    toUserId={t.to}
                    toName={nameOf(t.to)}
                    amountCents={t.amountCents}
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gastos recientes</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {(expenses ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">Todavía no hay gastos.</p>
          )}
          {(expenses ?? []).map((e) => (
            <div key={e.id} className="flex items-center justify-between text-sm">
              <span>
                {e.description}{" "}
                <span className="text-muted-foreground">— {nameOf(e.paid_by)}</span>
              </span>
              <span>{formatCents(e.amount_cents)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
