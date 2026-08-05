import type { HTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

// Lightweight table primitives matching the design: uppercase muted headers,
// hairline row separators, hover highlight. Compose them in pages; the outer
// <Table> handles horizontal overflow so wide tables scroll instead of
// breaking the layout.
export function Table({ className, children }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full border-collapse text-sm", className)}>
        {children}
      </table>
    </div>
  );
}

export function Thead({ children }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead>{children}</thead>;
}

export function Th({ className, children, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "border-b border-line px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-faint",
        className,
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function Tbody({ children }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody>{children}</tbody>;
}

export function Tr({ className, children, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn("border-b border-line last:border-0 hover:bg-page/60", className)}
      {...props}
    >
      {children}
    </tr>
  );
}

export function Td({ className, children, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn("px-4 py-3.5 align-middle text-ink", className)} {...props}>
      {children}
    </td>
  );
}
