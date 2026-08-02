"use client";

import { useActionState, useRef } from "react";
import { Plus } from "lucide-react";
import { addExpense } from "@/app/actions/expenses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AddExpenseForm({ householdId }: { householdId: string }) {
  const [state, action, pending] = useActionState(addExpense, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await action(formData);
        formRef.current?.reset();
      }}
      className="flex flex-col gap-3"
    >
      <input type="hidden" name="household_id" value={householdId} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Descripción</Label>
        <Input id="description" name="description" placeholder="Compra Mercadona" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="amount">Importe (€)</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="24.50"
          required
        />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        <Plus className="size-4" />
        {pending ? "Guardando..." : "Añadir gasto"}
      </Button>
    </form>
  );
}
