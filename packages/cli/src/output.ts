export function printJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

export function printTable(rows: Array<Record<string, unknown>>, columns?: string[]): void {
  if (rows.length === 0) {
    process.stdout.write("(no rows)\n");
    return;
  }
  const cols = columns ?? Object.keys(rows[0]!);
  const widths = cols.map((c) =>
    Math.max(c.length, ...rows.map((r) => String(r[c] ?? "").length)),
  );
  const line = (vals: string[]) =>
    vals.map((v, i) => v.padEnd(widths[i] ?? 0)).join("  ");

  process.stdout.write(`${line(cols)}\n`);
  process.stdout.write(`${widths.map((w) => "-".repeat(w)).join("  ")}\n`);
  for (const row of rows) {
    process.stdout.write(`${line(cols.map((c) => String(row[c] ?? "")))}\n`);
  }
}
