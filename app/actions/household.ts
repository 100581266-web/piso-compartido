"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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
