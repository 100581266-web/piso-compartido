/** Quotes a CSV field only when it needs it (contains a comma, quote or
 * newline), doubling any inner quotes per RFC 4180. */
export function csvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Builds a CSV string from a header row and data rows. Prefixes a UTF-8
 * BOM so Excel opens accented characters correctly instead of mangling
 * them. */
export function toCsv(headers: string[], rows: string[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(csvField).join(","));
  return "﻿" + lines.join("\r\n") + "\r\n";
}
