import { ListChecks, SprayCan } from "lucide-react";
import { requireHousehold, getHouseholdMembers } from "@/lib/household";
import { formatDate, isOverdue, isToday } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AddChoreForm } from "./add-chore-form";
import { CompleteChoreButton } from "./complete-chore-button";
import { ChoreRowActions } from "./chore-row-actions";
import { ChoresCalendar } from "./chores-calendar";
import { choreEmoji } from "@/lib/emoji-match";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default async function ChoresPage() {
  const { supabase, user, household } = await requireHousehold();
  const members = await getHouseholdMembers(supabase, household.id);
  const nameOf = (userId: string) =>
    members.find((m) => m.userId === userId)?.displayName ?? "—";
  const memberIndex = Object.fromEntries(members.map((m, i) => [m.userId, i]));
  const memberNames = Object.fromEntries(members.map((m) => [m.userId, m.displayName]));

  const { data: assignments } = await supabase
    .from("chore_assignments")
    .select("id, chore_id, assigned_to, due_date, chores(name, recurrence_days, rotation_order)")
    .eq("household_id", household.id)
    .eq("status", "pending")
    .order("due_date", { ascending: true });

  const calendarChores = (assignments ?? []).map((a) => {
    const chore = a.chores as unknown as {
      name: string;
      recurrence_days: number;
      rotation_order: string[];
    } | null;
    return {
      id: a.chore_id,
      name: chore?.name ?? "",
      recurrenceDays: chore?.recurrence_days ?? 7,
      rotationOrder: chore?.rotation_order ?? [],
      currentAssignedTo: a.assigned_to,
      currentDueDate: new Date(a.due_date),
    };
  });

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
        <CardContent className="pt-6">
          <Tabs defaultValue="list">
            <TabsList className="mb-3 w-full">
              <TabsTrigger value="list" className="flex-1">
                Lista
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex-1">
                Calendario
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list">
              <div className="flex flex-col gap-3">
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
                    rotation_order: string[];
                  } | null;
                  const overdue = isOverdue(a.due_date);
                  const today = isToday(a.due_date);
                  const name = nameOf(a.assigned_to);
                  return (
                    <div key={a.id} className="flex items-center gap-3 text-sm">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-base">
                        {choreEmoji(chore?.name ?? "")}
                      </div>
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
                            householdId={household.id}
                            name={chore?.name ?? ""}
                            recurrenceDays={chore?.recurrence_days ?? 7}
                            rotationOrder={chore?.rotation_order ?? []}
                            members={members}
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
              </div>
            </TabsContent>

            <TabsContent value="calendar">
              {calendarChores.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <SprayCan className="size-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    Todavía no hay tareas domésticas. Añade la primera arriba.
                  </p>
                </div>
              ) : (
                <ChoresCalendar
                  chores={calendarChores}
                  memberIndex={memberIndex}
                  memberNames={memberNames}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
