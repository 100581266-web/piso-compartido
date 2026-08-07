import { ListChecks, SprayCan } from "lucide-react";
import { requireHousehold, getHouseholdMembers } from "@/lib/household";
import { formatDate, isOverdue, isToday } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AddChoreForm } from "./add-chore-form";
import { CompleteChoreButton } from "./complete-chore-button";
import { ChoreRowActions } from "./chore-row-actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default async function ChoresPage() {
  const { supabase, user, household } = await requireHousehold();
  const members = await getHouseholdMembers(supabase, household.id);
  const nameOf = (userId: string) =>
    members.find((m) => m.userId === userId)?.displayName ?? "—";

  const { data: assignments } = await supabase
    .from("chore_assignments")
    .select("id, chore_id, assigned_to, due_date, chores(name, recurrence_days)")
    .eq("household_id", household.id)
    .eq("status", "pending")
    .order("due_date", { ascending: true });

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 p-4">
      <Card>
        <CardHeader>
          <div className="mb-1 flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <ListChecks className="size-4" />
          </div>
          <CardTitle className="text-base">Añadir tarea</CardTitle>
          <CardDescription>Se rota entre todos los compañeros</CardDescription>
        </CardHeader>
        <CardContent>
          <AddChoreForm householdId={household.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tareas pendientes</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {(assignments ?? []).length === 0 && (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <SprayCan className="size-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Todavía no hay tareas domésticas. Añade la primera arriba.
              </p>
            </div>
          )}
          {(assignments ?? []).map((a) => {
            const chore = a.chores as unknown as {
              name: string;
              recurrence_days: number;
            } | null;
            const overdue = isOverdue(a.due_date);
            const today = isToday(a.due_date);
            const name = nameOf(a.assigned_to);
            return (
              <div key={a.id} className="flex items-center gap-3 text-sm">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-primary/15 text-xs text-primary">
                    {name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{chore?.name}</p>
                  <p className="text-muted-foreground">
                    {name} · cada {chore?.recurrence_days} días
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1">
                    <Badge
                      variant={overdue ? "destructive" : today ? "default" : "secondary"}
                      className={cn(!overdue && !today && "text-muted-foreground")}
                    >
                      {overdue ? "Atrasada" : today ? "Hoy" : formatDate(a.due_date)}
                    </Badge>
                    <ChoreRowActions
                      choreId={a.chore_id}
                      name={chore?.name ?? ""}
                      recurrenceDays={chore?.recurrence_days ?? 7}
                    />
                  </div>
                  {a.assigned_to === user.id && (
                    <CompleteChoreButton
                      householdId={household.id}
                      choreId={a.chore_id}
                      assignmentId={a.id}
                      assignedTo={a.assigned_to}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
