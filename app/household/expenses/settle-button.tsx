"use client";

import { useActionState } from "react";
import { recordSettlement } from "@/app/actions/expenses";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/format";

export function SettleButton({
  householdId,
  fromUserId,
  fromName,
  toUserId,
  toName,
  amountCents,
  perspective,
}: {
  householdId: string;
  fromUserId: string;
  fromName: string;
  toUserId: string;
  toName: string;
  amountCents: number;
  /** "debtor" = soy quien paga; "creditor" = soy a quien le pagan */
  perspective: "debtor" | "creditor";
}) {
  const [state, action, pending] = useActionState(recordSettlement, undefined);

  const label =
    perspective === "debtor"
      ? `Marcar pago a ${toName} (${formatCents(amountCents)})`
      : `Confirmar cobro de ${fromName} (${formatCents(amountCents)})`;

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="household_id" value={householdId} />
      <input type="hidden" name="from_user_id" value={fromUserId} />
      <input type="hidden" name="to_user_id" value={toUserId} />
      <input type="hidden" name="amount_cents" value={amountCents} />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "Guardando..." : label}
      </Button>
      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
    </form>
  );
}
