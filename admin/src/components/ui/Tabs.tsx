import { cn } from "@/lib/cn";

// Horizontal filter tabs with optional counts (the "All 142 · Pending 7 …"
// pattern from the bookings design). Generic over the value type so callers get
// type-safe onChange.
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { label: string; value: T; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-1 overflow-x-auto border-b border-line", className)}>
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors",
              active
                ? "border-brand text-brand"
                : "border-transparent text-muted hover:text-ink",
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-xs font-semibold",
                  active ? "bg-brand-soft text-brand" : "bg-page text-faint",
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
