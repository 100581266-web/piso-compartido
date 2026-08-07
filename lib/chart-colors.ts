/** Fixed categorical slot order — never cycle/generate hues, always the same
 * slot for the same position so a person's color stays recognizable across
 * every chart in the app. */
export function chartColor(index: number): string {
  return `var(--chart-${(index % 8) + 1})`;
}
