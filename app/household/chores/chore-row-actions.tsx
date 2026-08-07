"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { deleteChore, updateChore } from "@/app/actions/chores";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ChoreRowActions({
  choreId,
  name,
  recurrenceDays,
}: {
  choreId: string;
  name: string;
  recurrenceDays: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(undefined);
    const formData = new FormData(e.currentTarget);
    const result = await updateChore(undefined, formData);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("¿Borrar esta tarea? Se borra también su historial. No se puede deshacer.")) {
      return;
    }
    setDeleting(true);
    const formData = new FormData();
    formData.set("chore_id", choreId);
    await deleteChore(undefined, formData);
    setDeleting(false);
    router.refresh();
  }

  return (
    <div className="flex shrink-0 gap-1">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button type="button" variant="ghost" size="icon-sm" />}>
          <Pencil className="size-3.5" />
        </DialogTrigger>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <input type="hidden" name="chore_id" value={choreId} />
            <DialogHeader>
              <DialogTitle>Editar tarea</DialogTitle>
              <DialogDescription>
                El nuevo intervalo se aplica a partir del próximo turno.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-chore-name">Tarea</Label>
                <Input id="edit-chore-name" name="name" defaultValue={name} required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-chore-recurrence">Cada cuántos días</Label>
                <Input
                  id="edit-chore-recurrence"
                  name="recurrence_days"
                  type="number"
                  min="1"
                  defaultValue={recurrenceDays}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? "Guardando..." : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={handleDelete}
        disabled={deleting}
        aria-label="Borrar tarea"
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}
