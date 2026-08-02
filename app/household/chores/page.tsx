import { requireHousehold, getHouseholdMembers } from "@/lib/household";
import { AddChoreForm } from "./add-chore-form";
import { CompleteChoreButton } from "./complete-chore-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
            <p className="text-sm text-muted-foreground">
              Todavía no hay tareas domésticas.
            </p>
          )}
          {(assignments ?? []).map((a) => {
            const chore = a.chores as unknown as {
              name: string;
              recurrence_days: number;
            } | null;
            return (
              <div key={a.id} className="flex items-center justify-between gap-2 text-sm">
                <div>
                  <p className="font-medium">{chore?.name}</p>
                  <p className="text-muted-foreground">
                    {nameOf(a.assigned_to)} — {a.due_date} · cada {chore?.recurrence_days} días
                  </p>
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
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
