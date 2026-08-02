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
