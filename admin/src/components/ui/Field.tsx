import type { InputHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

// Labelled form field wrapper. `hint` shows on the right of the label row
// (e.g. a "Forgot password?" link); `error` renders below in red.
export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between">
        <label htmlFor={htmlFor} className="text-sm font-semibold text-ink">
          {label}
        </label>
        {hint}
      </div>
      {children}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

// The soft-filled input from the design (no visible border until focus).
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-field bg-field px-3.5 py-2.5 text-sm text-ink placeholder:text-faint",
          "border border-transparent transition-colors",
          "focus:border-brand/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/15",
          className,
        )}
        {...props}
      />
    );
  },
);
