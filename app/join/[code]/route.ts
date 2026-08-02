import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const supabase = await createClient();

  const { error } = await supabase.rpc("join_household", {
    _invite_code: code,
  });

  const url = request.nextUrl.clone();
  url.search = "";

  if (error) {
    url.pathname = "/onboarding";
    url.searchParams.set("error", "invite");
  } else {
    url.pathname = "/household";
  }

  return NextResponse.redirect(url);
}
