import { cn } from "@/lib/cn";

// Official Supracarer logo (hands + heart + leaves, with wordmark). Two files:
//   • light  → full-logo.png  (colour, blue wordmark) for white backgrounds
//   • dark   → logo-white.png (white) for the navy sidebar
// Served from /public. Sized by height with width auto so the aspect ratio is
// preserved. Plain <img>: a small, static, self-hosted asset — next/image
// optimization isn't worth its width/height sizing constraints here.
const HEIGHTS = { sm: "h-8", md: "h-12", lg: "h-20" } as const;

export function Logo({
  variant = "light",
  size = "md",
  className,
}: {
  variant?: "light" | "dark";
  size?: keyof typeof HEIGHTS;
  className?: string;
}) {
  const src = variant === "dark" ? "/logo-white.png" : "/full-logo.png";
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Supracarer"
      className={cn("w-auto object-contain", HEIGHTS[size], className)}
    />
  );
}
