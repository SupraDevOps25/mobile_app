"use client";

import type { InputHTMLAttributes } from "react";
import { forwardRef, useState } from "react";
import { cn } from "@/lib/cn";
import { EyeIcon, EyeOffIcon } from "@/components/icons";
import { Input } from "./Field";

// Password field with a show/hide toggle. Same look as Input, with room on the
// right for the eye button. `type` is controlled internally, so callers pass
// everything else (id, placeholder, autoComplete, RHF register props).
export const PasswordInput = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, "type">
>(function PasswordInput({ className, ...props }, ref) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        ref={ref}
        type={visible ? "text" : "password"}
        className={cn("pr-11", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-2 text-faint transition-colors hover:text-ink focus:outline-none focus:ring-2 focus:ring-brand/15"
        tabIndex={-1}
      >
        {visible ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
      </button>
    </div>
  );
});
