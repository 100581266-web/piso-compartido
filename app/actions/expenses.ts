"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { splitEqually } from "@/lib/debt-simplify";
import { EXPENSE_CATEGORIES, type ExpenseCategory } from "@/lib/categories";

function parseCategory(formData: FormData): ExpenseCategory {
  const value = String(formData.get("category") ?? "otros");
  return (EXPENSE_CATEGORIES as readonly string[]).includes(value)
    ? (value as ExpenseCategory)
    : "otros";
}

export type ExpenseFormState = { error?: string } | undefined;

export async function addExpense(
  _prevState: ExpenseFormState,
  formData: FormData
): Promise<ExpenseFormState> {
  const householdId = String(formData.get("household_id") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const amountEuros = Number(formData.get("amount"));
  const participantIds = formData.getAll("participant_ids").map(String);

  if (!description) {
    return { error: "Ponle una descripción al gasto." };
  }
  if (!amountEuros || amountEuros <= 0) {
    return { error: "El importe no es válido." };
  }
  if (participantIds.length === 0) {
    return { error: "Elige quién participa en este gasto." };
  }

  const amountCents = Math.round(amountEuros * 100);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: expense, error: expenseError } = await supabase
    .from("expenses")
    .insert({
      household_id: householdId,
      paid_by: user!.id,
      created_by: user!.id,
      description,
      amount_cents: amountCents,
      category: parseCategory(formData),
    })
    .select()
    .single();

  if (expenseError) {
    return { error: "No se ha podido guardar el gasto: " + expenseError.message };
  }

  const shares = splitEqually(amountCents, participantIds);

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
  revalidatePath("/household");
}

export async function updateExpense(
  _prevState: ExpenseFormState,
  formData: FormData
): Promise<ExpenseFormState> {
  const expenseId = String(formData.get("expense_id") ?? "");
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

  const { data: existingShares, error: fetchError } = await supabase
    .from("expense_shares")
    .select("user_id")
    .eq("expense_id", expenseId);

  if (fetchError || !existingShares) {
    return { error: "No se ha podido cargar el reparto original." };
  }

  const { error: updateError } = await supabase
    .from("expenses")
    .update({ description, amount_cents: amountCents, category: parseCategory(formData) })
    .eq("id", expenseId);

  if (updateError) {
    return { error: "No se ha podido actualizar el gasto: " + updateError.message };
  }

  const newShares = splitEqually(
    amountCents,
    existingShares.map((s) => s.user_id)
  );

  for (const share of newShares) {
    const { error } = await supabase
      .from("expense_shares")
      .update({ share_cents: share.shareCents })
      .eq("expense_id", expenseId)
      .eq("user_id", share.userId);

    if (error) {
      return { error: "No se ha podido actualizar el reparto: " + error.message };
    }
  }

  revalidatePath("/household/expenses");
  revalidatePath("/household");
}

export async function deleteExpense(
  _prevState: ExpenseFormState,
  formData: FormData
): Promise<ExpenseFormState> {
  const expenseId = String(formData.get("expense_id") ?? "");
  const supabase = await createClient();

  const { error } = await supabase.from("expenses").delete().eq("id", expenseId);

  if (error) {
    return { error: "No se ha podido borrar el gasto: " + error.message };
  }

  revalidatePath("/household/expenses");
  revalidatePath("/household");
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
  revalidatePath("/household");
}

export type RecurringFormState = { error?: string } | undefined;

export async function addRecurringExpense(
  _prevState: RecurringFormState,
  formData: FormData
): Promise<RecurringFormState> {
  const householdId = String(formData.get("household_id") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const amountEuros = Number(formData.get("amount"));
  const dayOfMonth = Number(formData.get("day_of_month"));
  const paidBy = String(formData.get("paid_by") ?? "");

  if (!description) {
    return { error: "Ponle una descripción." };
  }
  if (!amountEuros || amountEuros <= 0) {
    return { error: "El importe no es válido." };
  }
  if (!dayOfMonth || dayOfMonth < 1 || dayOfMonth > 28) {
    return { error: "El día del mes debe estar entre 1 y 28." };
  }
  if (!paidBy) {
    return { error: "Elige quién lo paga." };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("recurring_expenses").insert({
    household_id: householdId,
    description,
    amount_cents: Math.round(amountEuros * 100),
    category: parseCategory(formData),
    day_of_month: dayOfMonth,
    paid_by: paidBy,
    created_by: paidBy,
  });

  if (error) {
    return { error: "No se ha podido crear el gasto fijo: " + error.message };
  }

  revalidatePath("/household/expenses");
}

export async function toggleRecurringExpense(formData: FormData) {
  const id = String(formData.get("recurring_expense_id") ?? "");
  const active = formData.get("active") === "true";

  const supabase = await createClient();
  await supabase.from("recurring_expenses").update({ active }).eq("id", id);

  revalidatePath("/household/expenses");
}

export async function deleteRecurringExpense(formData: FormData) {
  const id = String(formData.get("recurring_expense_id") ?? "");

  const supabase = await createClient();
  await supabase.from("recurring_expenses").delete().eq("id", id);

  revalidatePath("/household/expenses");
}

export async function generateRecurringNow() {
  const supabase = await createClient();
  await supabase.rpc("generate_recurring_expenses");

  revalidatePath("/household/expenses");
  revalidatePath("/household");
}
