import { chartColor } from "@/lib/chart-colors";

export type BarRow = {
  label: string;
  value: number;
  formattedValue: string;
};

export function BarRowChart({ rows, emptyMessage }: { rows: BarRow[]; emptyMessage: string }) {
  if (rows.length === 0) {
    return <p className="py-4 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  const max = Math.max(...rows.map((r) => r.value), 1);

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row, i) => (
        <div
          key={row.label}
          className="group flex items-center gap-2"
          title={`${row.label}: ${row.formattedValue}`}
        >
          <span className="w-20 shrink-0 truncate text-sm text-foreground">{row.label}</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-chart-grid">
            <div
              className="h-full rounded-full transition-[filter] group-hover:brightness-110"
              style={{
                width: `${Math.max((row.value / max) * 100, 3)}%`,
                backgroundColor: chartColor(i),
              }}
            />
          </div>
          <span className="w-14 shrink-0 text-right text-sm font-medium tabular-nums">
            {row.formattedValue}
          </span>
        </div>
      ))}
    </div>
  );
}
