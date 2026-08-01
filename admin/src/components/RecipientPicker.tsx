"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar, Badge, Spinner } from "@/components/ui";
import { SearchIcon, XIcon } from "@/components/icons";
import { useUserSearch } from "@/services/users/users.queries";
import { ROLE_LABELS, type AdminUserResult } from "@/services/users/users.types";
import { cn } from "@/lib/cn";

const ROLE_TONE = {
  FAMILY: "green",
  CAREGIVER: "blue",
  CARE_COORDINATOR: "brand",
  ADMIN: "slate",
} as const;

// Typeahead that searches users by name / email / phone and returns the picked
// account. Debounces input and closes on outside click.
export function RecipientPicker({
  value,
  onSelect,
}: {
  value: AdminUserResult | null;
  onSelect: (user: AdminUserResult | null) => void;
}) {
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(term), 250);
    return () => clearTimeout(t);
  }, [term]);

  // Close the dropdown when clicking away.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const { data, isFetching } = useUserSearch(debounced);
  const results = data ?? [];
  const showDropdown = open && debounced.trim().length >= 2;

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-field border border-line bg-white px-3 py-2.5">
        <Avatar name={value.name} photoUrl={value.photoUrl} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium text-ink">{value.name}</p>
            <Badge tone={ROLE_TONE[value.role]}>{ROLE_LABELS[value.role]}</Badge>
          </div>
          <p className="truncate text-xs text-muted">
            {value.email} · {value.phone}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            onSelect(null);
            setTerm("");
            setDebounced("");
          }}
          className="rounded-md p-1 text-muted transition-colors hover:bg-page hover:text-ink"
          title="Change recipient"
        >
          <XIcon size={16} />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2 rounded-field bg-field px-3.5 py-2.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand/15">
        <SearchIcon size={16} className="shrink-0 text-faint" />
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search by name, email or phone…"
          className="w-full bg-transparent text-sm text-ink placeholder:text-faint focus:outline-none"
        />
        {isFetching && <Spinner size={14} />}
      </div>

      {showDropdown && (
        <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-field border border-line bg-white py-1 shadow-lg">
          {results.length === 0 ? (
            <p className="px-3.5 py-3 text-sm text-muted">
              {isFetching ? "Searching…" : "No users match that search."}
            </p>
          ) : (
            results.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => {
                  onSelect(u);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-3 px-3.5 py-2 text-left transition-colors",
                  "hover:bg-page",
                )}
              >
                <Avatar name={u.name} photoUrl={u.photoUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-ink">
                      {u.name}
                    </p>
                    <Badge tone={ROLE_TONE[u.role]}>{ROLE_LABELS[u.role]}</Badge>
                  </div>
                  <p className="truncate text-xs text-muted">
                    {u.email} · {u.phone}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
