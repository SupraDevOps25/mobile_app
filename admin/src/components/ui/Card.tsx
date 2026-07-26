import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

// White surface with the app's soft border + shadow. `padded` toggles the
// default inner padding (turn off for tables that manage their own spacing).
export function Card({
  padded = true,
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { padded?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-card border border-line bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        padded && "p-5",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Optional header row inside a Card: title on the left, action (link/button)
// on the right — the "Recent bookings … See all" pattern from the design.
export function CardHeader({
  title,
  action,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-center justify-between", className)}>
      <h3 className="font-semibold text-ink">{title}</h3>
      {action}
    </div>
  );
}
