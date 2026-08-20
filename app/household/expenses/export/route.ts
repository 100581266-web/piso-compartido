import { requireHousehold, getHouseholdMembers, resolveNames } from "@/lib/household";
import { CATEGORY_LABELS, type ExpenseCategory } from "@/lib/categories";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const { supabase, household } = await requireHousehold();
  const members = await getHouseholdMembers(supabase, household.id);

  const [{ data: expenses }, { data: shares }] = await Promise.all([
    supabase
      .from("expenses")
      .select("id, description, amount_cents, paid_by, expense_date, category")
      .eq("household_id", household.id)
      .order("expense_date", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("expense_shares")
      .select("expense_id, user_id, share_cents")
      .eq("household_id", household.id),
  ]);

  const referencedIds = [
    ...(expenses ?? []).map((e) => e.paid_by),
    ...(shares ?? []).map((s) => s.user_id),
  ];
  const nameOf = await resolveNames(supabase, members, referencedIds);

  const participantsByExpense = (shares ?? []).reduce<Record<string, string[]>>((acc, s) => {
    acc[s.expense_id] = acc[s.expense_id] ?? [];
    acc[s.expense_id].push(nameOf(s.user_id));
    return acc;
  }, {});

  const rows = (expenses ?? []).map((e) => [
    e.expense_date,
    e.description,
    CATEGORY_LABELS[(e.category ?? "otros") as ExpenseCategory],
    (e.amount_cents / 100).toFixed(2),
    nameOf(e.paid_by),
    (participantsByExpense[e.id] ?? []).join("; "),
  ]);

  const csv = toCsv(
    ["Fecha", "Descripción", "Categoría", "Importe (€)", "Pagado por", "Repartido entre"],
    rows
  );

  const filename = `gastos-${household.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
