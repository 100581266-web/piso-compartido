"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type HouseholdFormState = { error?: string } | undefined;

export async function createHousehold(
  _prevState: HouseholdFormState,
  formData: FormData
): Promise<HouseholdFormState> {
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return { error: "Ponle un nombre al piso." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_household", { _name: name });

  if (error) {
    return { error: "No se ha podido crear el piso: " + error.message };
  }

  redirect("/household");
}

export async function joinHousehold(
  _prevState: HouseholdFormState,
  formData: FormData
): Promise<HouseholdFormState> {
  const code = String(formData.get("invite_code") ?? "").trim();

  if (!code) {
    return { error: "Escribe el código de invitación." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("join_household", {
    _invite_code: code,
  });

  if (error) {
    return { error: "Código no válido: " + error.message };
  }

  redirect("/household");
}

export async function renameHousehold(
  _prevState: HouseholdFormState,
  formData: FormData
): Promise<HouseholdFormState> {
  const householdId = String(formData.get("household_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return { error: "Ponle un nombre al piso." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("households")
    .update({ name })
    .eq("id", householdId);

  if (error) {
    return { error: "No se ha podido renombrar el piso: " + error.message };
  }

  revalidatePath("/household");
}

export type RegenerateCodeState = { error?: string; code?: string } | undefined;

export async function regenerateInviteCode(
  _prevState: RegenerateCodeState,
  formData: FormData
): Promise<RegenerateCodeState> {
  const householdId = String(formData.get("household_id") ?? "");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("regenerate_invite_code", {
    _household_id: householdId,
  });

  if (error) {
    return { error: "No se ha podido regenerar el código: " + error.message };
  }

  revalidatePath("/household");
  return { code: data as string };
}

export async function removeMember(
  _prevState: HouseholdFormState,
  formData: FormData
): Promise<HouseholdFormState> {
  const householdId = String(formData.get("household_id") ?? "");
  const userId = String(formData.get("user_id") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_household_member", {
    _household_id: householdId,
    _user_id: userId,
  });

  if (error) {
    return { error: "No se ha podido echar a esa persona: " + error.message };
  }

  revalidatePath("/household");
}

export async function leaveHousehold(formData: FormData) {
  const householdId = String(formData.get("household_id") ?? "");

  const supabase = await createClient();
  await supabase.rpc("leave_household", { _household_id: householdId });

  redirect("/onboarding");
}
