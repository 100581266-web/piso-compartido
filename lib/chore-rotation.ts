/**
 * Whoever is next in the fixed rotation order, given whose turn it is now.
 * If the current assignee is no longer in the rotation (they left the
 * household), the rotation restarts from the beginning of the list rather
 * than throwing, so a departure never gets a chore stuck.
 */
export function nextAssignee(rotationOrder: string[], currentAssigneeId: string): string {
  if (rotationOrder.length === 0) {
    throw new Error("La rotación no tiene compañeros.");
  }

  const currentIndex = rotationOrder.indexOf(currentAssigneeId);
  if (currentIndex === -1) {
    return rotationOrder[0];
  }

  return rotationOrder[(currentIndex + 1) % rotationOrder.length];
}

export function nextDueDate(fromDate: Date, recurrenceDays: number): Date {
  const next = new Date(fromDate);
  next.setDate(next.getDate() + recurrenceDays);
  return next;
}

export type ChoreOccurrence = {
  date: Date;
  assignedTo: string;
};

/**
 * Projects a chore's occurrences forward from its current real assignment
 * up to (and including) `until`, assuming everyone completes on time. Only
 * the first occurrence returned corresponds to a real chore_assignment row
 * in the database — the rest are estimates for calendar display, and shift
 * automatically if someone finishes early or late.
 */
export function projectChoreOccurrences(
  rotationOrder: string[],
  recurrenceDays: number,
  firstAssignee: string,
  firstDueDate: Date,
  until: Date
): ChoreOccurrence[] {
  const occurrences: ChoreOccurrence[] = [];
  let assignee = firstAssignee;
  let date = firstDueDate;
  let safety = 0;

  while (date <= until && safety < 366) {
    occurrences.push({ date: new Date(date), assignedTo: assignee });
    assignee = nextAssignee(rotationOrder, assignee);
    date = nextDueDate(date, recurrenceDays);
    safety++;
  }

  return occurrences;
}
