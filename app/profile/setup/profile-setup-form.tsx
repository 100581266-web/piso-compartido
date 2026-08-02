"use client";

import { useActionState } from "react";
import { setDisplayName } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ProfileSetupForm() {
  const [state, action, pending] = useActionState(setDisplayName, undefined);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>¿Cómo te llamamos?</CardTitle>
        <CardDescription>
          Tus compañeros de piso verán este nombre en los gastos y tareas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="display_name">Nombre</Label>
            <Input id="display_name" name="display_name" placeholder="Marc" required autoFocus />
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <Button type="submit" disabled={pending}>
            {pending ? "Guardando..." : "Continuar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
