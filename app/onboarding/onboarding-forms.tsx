"use client";

import { useActionState } from "react";
import { Home, Plus, Users } from "lucide-react";
import { createHousehold, joinHousehold } from "@/app/actions/household";
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
import { Separator } from "@/components/ui/separator";

export function OnboardingForms() {
  const [createState, createAction, createPending] = useActionState(
    createHousehold,
    undefined
  );
  const [joinState, joinAction, joinPending] = useActionState(
    joinHousehold,
    undefined
  );

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="mb-1 flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Home className="size-4" />
          </div>
          <CardTitle>Crea tu piso</CardTitle>
          <CardDescription>
            Serás el admin y podrás invitar a tus compañeros con un código.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nombre del piso</Label>
              <Input id="name" name="name" placeholder="Piso de la calle X" required />
            </div>
            {createState?.error && (
              <p className="text-sm text-destructive">{createState.error}</p>
            )}
            <Button type="submit" disabled={createPending}>
              <Plus className="size-4" />
              {createPending ? "Creando..." : "Crear piso"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">o</span>
        <Separator className="flex-1" />
      </div>

      <Card>
        <CardHeader>
          <div className="mb-1 flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Users className="size-4" />
          </div>
          <CardTitle>Únete a un piso</CardTitle>
          <CardDescription>
            Pide el código de invitación a un compañero.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={joinAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="invite_code">Código de invitación</Label>
              <Input
                id="invite_code"
                name="invite_code"
                placeholder="ABC123"
                className="uppercase"
                required
              />
            </div>
            {joinState?.error && (
              <p className="text-sm text-destructive">{joinState.error}</p>
            )}
            <Button type="submit" variant="outline" disabled={joinPending}>
              {joinPending ? "Uniéndote..." : "Unirme al piso"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
