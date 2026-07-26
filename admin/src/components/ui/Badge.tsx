import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type Tone =
  | "green"
  | "blue"
  | "amber"
  | "red"
  | "slate"
  | "gray"
  | "brand";

const TONES: Record<Tone, string> = {
  green: "bg-emerald-50 text-emerald-700",
  blue: "bg-blue-50 text-blue-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-600",
  slate: "bg-slate-100 text-slate-700",
  gray: "bg-gray-100 text-gray-600",
  brand: "bg-brand-soft text-brand",
};

export function Badge({
  tone = "gray",
  dot,
  className,
  children,
}: {
  tone?: Tone;
  dot?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        TONES[tone],
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
