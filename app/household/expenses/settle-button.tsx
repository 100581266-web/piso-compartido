"use client";

import { useActionState } from "react";
import { recordSettlement } from "@/app/actions/expenses";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/format";

export function SettleButton({
  householdId,
  toUserId,
  toName,
  amountCents,
}: {
  householdId: string;
  toUserId: string;
  toName: string;
  amountCents: number;
}) {
  const [state, action, pending] = useActionState(recordSettlement, undefined);

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="household_id" value={householdId} />
      <input type="hidden" name="to_user_id" value={toUserId} />
      <input type="hidden" name="amount_cents" value={amountCents} />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "Guardando..." : `Marcar pago a ${toName} (${formatCents(amountCents)})`}
      </Button>
      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
    </form>
  );
}
