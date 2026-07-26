import { cn } from "@/lib/cn";

// Supracarer wordmark + mark. `variant` flips the wordmark colour for the
// light login card vs the dark sidebar. The mark is a heart cradled by hands
// (teal + blue) — swap in the official SVG here later without touching callers.
export function Logo({
  variant = "light",
  size = "md",
  className,
}: {
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const mark = { sm: 24, md: 30, lg: 36 }[size];
  const text = { sm: "text-lg", md: "text-xl", lg: "text-2xl" }[size];

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark size={mark} />
      <span className={cn("font-bold tracking-tight", text)}>
        <span className={variant === "dark" ? "text-white" : "text-brand"}>
          Supra
        </span>
        <span className={variant === "dark" ? "text-teal" : "text-teal"}>
          carer
        </span>
      </span>
    </span>
  );
}

export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      {/* hands cradling the heart */}
      <path
        d="M5 25c0 10 8.5 17 19 17s19-7 19-17"
        stroke="#2743c7"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      {/* heart */}
      <path
        d="M24 30S13.5 23.7 13.5 16.7C13.5 12.9 16.5 10 20.1 10c2.2 0 3.9 1.1 3.9 1.1S25.7 10 27.9 10c3.6 0 6.6 2.9 6.6 6.7C34.5 23.7 24 30 24 30z"
        fill="#0d9488"
      />
    </svg>
  );
}
