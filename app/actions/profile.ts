"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ProfileFormState = { error?: string } | undefined;

export async function setDisplayName(
  _prevState: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const name = String(formData.get("display_name") ?? "").trim();

  if (!name) {
    return { error: "Dinos cómo te llamas." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: name })
    .eq("id", user!.id);

  if (error) {
    return { error: "No se ha podido guardar: " + error.message };
  }

  redirect("/");
}
