// The backend doesn't store avatar colors, so we derive a stable one from a
// seed (a name or id). Same seed → same color across the app.
const AVATAR_COLORS = [
  "#3b82f6",
  "#0d9488",
  "#d97706",
  "#7c3aed",
  "#db2777",
  "#16a34a",
  "#ea580c",
  "#4f46e5",
];

export function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function initialsOf(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
