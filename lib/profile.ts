import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Magic-link login never asks for a name, so a fresh profile has no
 * display_name. Every authenticated entry point should call this before
 * doing anything else, so nobody ends up shown as "Sin nombre" to their
 * flatmates.
 */
export async function requireDisplayName(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .single();

  if (!profile?.display_name) {
    redirect("/profile/setup");
  }
}
