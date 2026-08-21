"use client";

import { useActionState } from "react";
import { leaveHousehold } from "@/app/actions/household";
import { Button } from "@/components/ui/button";

export function LeaveHouseholdButton({ householdId }: { householdId: string }) {
  const [state, action, pending] = useActionState(leaveHousehold, undefined);

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="household_id" value={householdId} />
      <Button type="submit" variant="outline" className="w-full" disabled={pending}>
        {pending ? "Saliendo..." : "Salir del piso"}
      </Button>
      {state?.error && <p className="text-center text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
