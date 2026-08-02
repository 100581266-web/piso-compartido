import { getHouseholdMembers, requireHousehold } from "@/lib/household";
import { InviteCode } from "./invite-code";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/actions/auth";

export default async function HouseholdPage() {
  const { supabase, household } = await requireHousehold();
  const members = await getHouseholdMembers(supabase, household.id);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invita a tus compañeros</CardTitle>
          <CardDescription>Comparte este código o el enlace</CardDescription>
        </CardHeader>
        <CardContent>
          <InviteCode code={household.invite_code} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Compañeros de piso</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {members.map((m) => (
            <div key={m.userId} className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback className="bg-primary/15 text-primary">
                  {m.displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="flex-1 text-sm">{m.displayName}</span>
              {m.role === "admin" && <Badge variant="secondary">admin</Badge>}
            </div>
          ))}
        </CardContent>
      </Card>

      <form action={signOut}>
        <Button type="submit" variant="ghost" className="w-full">
          Cerrar sesión
        </Button>
      </form>
    </div>
  );
}
