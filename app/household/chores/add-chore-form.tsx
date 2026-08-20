"use client";

import { useActionState, useRef } from "react";
import { Plus } from "lucide-react";
import { addChore } from "@/app/actions/chores";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export function AddChoreForm({
  householdId,
  members,
}: {
  householdId: string;
  members: { userId: string; displayName: string }[];
}) {
  const [state, action, pending] = useActionState(addChore, undefined);
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
        <Label htmlFor="name">Tarea</Label>
        <Input id="name" name="name" placeholder="Sacar la basura" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="recurrence_days">Cada cuántos días</Label>
        <Input
          id="recurrence_days"
          name="recurrence_days"
          type="number"
          min="1"
          defaultValue="7"
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label>¿Quién entra en la rotación?</Label>
        <div className="flex flex-col gap-2">
          {members.map((m) => (
            <label key={m.userId} className="flex items-center gap-2 text-sm">
              <Checkbox name="rotation_order" value={m.userId} defaultChecked />
              {m.displayName}
            </label>
          ))}
        </div>
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        <Plus className="size-4" />
        {pending ? "Creando..." : "Añadir tarea"}
      </Button>
    </form>
  );
}
