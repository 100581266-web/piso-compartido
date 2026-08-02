"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
import { completeChore } from "@/app/actions/chores";
import { Button } from "@/components/ui/button";

export function CompleteChoreButton({
  householdId,
  choreId,
  assignmentId,
  assignedTo,
}: {
  householdId: string;
  choreId: string;
  assignmentId: string;
  assignedTo: string;
}) {
  const [state, action, pending] = useActionState(completeChore, undefined);

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="household_id" value={householdId} />
      <input type="hidden" name="chore_id" value={choreId} />
      <input type="hidden" name="assignment_id" value={assignmentId} />
      <input type="hidden" name="assigned_to" value={assignedTo} />
      <Button type="submit" size="sm" disabled={pending}>
        <Check className="size-4" />
        {pending ? "Guardando..." : "Marcar hecho"}
      </Button>
      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
    </form>
  );
}
