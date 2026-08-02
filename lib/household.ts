import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireDisplayName } from "@/lib/profile";

export type Household = {
  id: string;
  name: string;
  invite_code: string;
};

export type HouseholdMember = {
  userId: string;
  role: "admin" | "member";
  displayName: string;
};

/**
 * Loads the current user's household, redirecting to /onboarding if they
 * don't belong to one yet. Every page under a household should start here
 * instead of re-querying membership itself.
 */
export async function requireHousehold() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await requireDisplayName(supabase, user!.id);

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id, households(id, name, invite_code)")
    .eq("user_id", user!.id)
    .limit(1)
    .maybeSingle();

  if (!membership) {
    redirect("/onboarding");
  }

  const household = membership.households as unknown as Household;

  return { supabase, user: user!, household };
}

export async function getHouseholdMembers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  householdId: string
): Promise<HouseholdMember[]> {
  const { data } = await supabase
    .from("household_members")
    .select("user_id, role, profiles(display_name)")
    .eq("household_id", householdId);

  return (data ?? []).map((m) => {
    const profile = m.profiles as unknown as { display_name: string | null } | null;
    return {
      userId: m.user_id as string,
      role: m.role as "admin" | "member",
      displayName: profile?.display_name || "Sin nombre",
    };
  });
}
