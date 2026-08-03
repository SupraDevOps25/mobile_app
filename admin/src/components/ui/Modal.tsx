"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { XIcon } from "@/components/icons";

// Lightweight centered modal over a dimmed backdrop. Closes on backdrop click
// or Escape. Kept dependency-free to match the rest of the UI kit.
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        onClick={onClose}
        aria-hidden
        className="absolute inset-0 bg-slate-900/50"
      />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-card border border-line bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-base font-bold text-ink">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted transition-colors hover:bg-page hover:text-ink"
            aria-label="Close"
          >
            <XIcon size={18} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
