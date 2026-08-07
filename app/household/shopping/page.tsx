import { ShoppingCart } from "lucide-react";
import { requireHousehold, getHouseholdMembers } from "@/lib/household";
import { ShoppingList } from "./shopping-list";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ShoppingPage() {
  const { supabase, user, household } = await requireHousehold();
  const members = await getHouseholdMembers(supabase, household.id);
  const memberNames = Object.fromEntries(members.map((m) => [m.userId, m.displayName]));

  const { data: items } = await supabase
    .from("shopping_items")
    .select("id, name, quantity, is_checked, added_by, checked_by, owner_user_id")
    .eq("household_id", household.id)
    .order("created_at", { ascending: true });

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 p-4">
      <Card>
        <CardHeader>
          <div className="mb-1 flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <ShoppingCart className="size-4" />
          </div>
          <CardTitle className="text-base">Lista de la compra</CardTitle>
          <CardDescription>Se actualiza al momento para todos</CardDescription>
        </CardHeader>
        <CardContent>
          <ShoppingList
            householdId={household.id}
            currentUserId={user.id}
            memberNames={memberNames}
            initialItems={items ?? []}
          />
        </CardContent>
      </Card>
    </div>
  );
}
