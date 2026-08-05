// Tiny classNames joiner — dependency-free clsx substitute. Falsy parts drop
// out so you can write cn("base", active && "on", disabled ? "off" : null).
export function cn(
  ...parts: Array<string | false | null | undefined>
): string {
  return parts.filter(Boolean).join(" ");
}
