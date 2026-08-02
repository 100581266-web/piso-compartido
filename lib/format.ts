export function formatCents(amountCents: number): string {
  return (amountCents / 100).toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
  });
}
