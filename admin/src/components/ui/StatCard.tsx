import { cn } from "@/lib/cn";
import { Card } from "./Card";

// Dashboard metric tile: label, big value, optional delta line, and a soft
// tinted circle in the corner. Tint is decorative only (matches the four
// pastel circles in the design).
export function StatCard({
  label,
  value,
  delta,
  deltaTone = "green",
  tint = "blue",
}: {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: "green" | "muted";
  tint?: "blue" | "green" | "amber" | "violet";
}) {
  const tints = {
    blue: "bg-blue-100",
    green: "bg-emerald-100",
    amber: "bg-amber-100",
    violet: "bg-violet-100",
  };
  return (
    <Card className="relative overflow-hidden">
      <span
        className={cn(
          "absolute right-4 top-4 size-10 rounded-full opacity-70",
          tints[tint],
        )}
      />
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-3 text-3xl font-bold tracking-tight text-ink">{value}</p>
      {delta && (
        <p
          className={cn(
            "mt-2 text-xs font-medium",
            deltaTone === "green" ? "text-emerald-600" : "text-muted",
          )}
        >
          {delta}
        </p>
      )}
    </Card>
  );
}
