// Small formatting helpers shared across pages.

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Ghana cedi amount, e.g. "GHS 1,250".
export function formatGhs(amount: number): string {
  return `GHS ${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

// A billing month range, e.g. "1–31 Jul 2026" (or full range across months).
export function formatPeriod(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "—";
  const sameMonth =
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear();
  if (sameMonth) {
    return `${start.getDate()}–${end.getDate()} ${start.toLocaleDateString(
      undefined,
      { month: "short", year: "numeric" },
    )}`;
  }
  return `${formatDate(startIso)} – ${formatDate(endIso)}`;
}
