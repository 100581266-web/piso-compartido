import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireDisplayName } from "@/lib/profile";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await requireDisplayName(supabase, user!.id);

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user!.id)
    .limit(1)
    .maybeSingle();

  redirect(membership ? "/household" : "/onboarding");
}
