"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getHouseholdMembers } from "@/lib/household";
import { splitEqually } from "@/lib/debt-simplify";

export type ExpenseFormState = { error?: string } | undefined;

export async function addExpense(
  _prevState: ExpenseFormState,
  formData: FormData
): Promise<ExpenseFormState> {
  const householdId = String(formData.get("household_id") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const amountEuros = Number(formData.get("amount"));

  if (!description) {
    return { error: "Ponle una descripción al gasto." };
  }
  if (!amountEuros || amountEuros <= 0) {
    return { error: "El importe no es válido." };
  }

  const amountCents = Math.round(amountEuros * 100);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const members = await getHouseholdMembers(supabase, householdId);
  if (members.length === 0) {
    return { error: "No hay compañeros en este piso todavía." };
  }

  const { data: expense, error: expenseError } = await supabase
    .from("expenses")
    .insert({
      household_id: householdId,
      paid_by: user!.id,
      created_by: user!.id,
      description,
      amount_cents: amountCents,
    })
    .select()
    .single();

  if (expenseError) {
    return { error: "No se ha podido guardar el gasto: " + expenseError.message };
  }

  const shares = splitEqually(
    amountCents,
    members.map((m) => m.userId)
  );

  const { error: sharesError } = await supabase.from("expense_shares").insert(
    shares.map((s) => ({
      household_id: householdId,
      expense_id: expense.id,
      user_id: s.userId,
      share_cents: s.shareCents,
    }))
  );

  if (sharesError) {
    return { error: "No se ha podido repartir el gasto: " + sharesError.message };
  }

  revalidatePath("/household/expenses");
}

export type SettleFormState = { error?: string } | undefined;

export async function recordSettlement(
  _prevState: SettleFormState,
  formData: FormData
): Promise<SettleFormState> {
  const householdId = String(formData.get("household_id") ?? "");
  const toUserId = String(formData.get("to_user_id") ?? "");
  const amountCents = Number(formData.get("amount_cents"));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("settlements").insert({
    household_id: householdId,
    from_user_id: user!.id,
    to_user_id: toUserId,
    amount_cents: amountCents,
  });

  if (error) {
    return { error: "No se ha podido registrar el pago: " + error.message };
  }

  revalidatePath("/household/expenses");
}
