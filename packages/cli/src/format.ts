/** Human-friendly byte formatting (1234567 → "1.2M"). Accepts numeric strings. */
export function bytes(n: number | string | undefined): string {
  if (n === undefined || n === null || n === "") return "";
  const num = typeof n === "string" ? Number(n) : n;
  if (!Number.isFinite(num)) return "";
  const units = ["B", "K", "M", "G", "T", "P"];
  let v = num;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)}${units[i]}`;
}

/** Percentage from a part/total pair (numeric strings allowed). */
export function pctOf(part: number | string | undefined, total: number | string | undefined): string {
  const p = typeof part === "string" ? Number(part) : part;
  const t = typeof total === "string" ? Number(total) : total;
  if (!p || !t || !Number.isFinite(p) || !Number.isFinite(t)) return "";
  return `${((p / t) * 100).toFixed(1)}%`;
}

/** Unix seconds → "YYYY-MM-DD HH:MM:SS" (UTC). Empty for 0/undefined. */
export function unixToIso(sec: number | undefined): string {
  if (!sec) return "";
  return new Date(sec * 1000).toISOString().replace("T", " ").slice(0, 19);
}
