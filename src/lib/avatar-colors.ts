import { hashString } from "@/lib/categories";

const AVATAR_COLOR_CLASSES = [
  "bg-orange-500/20 text-orange-700 dark:text-orange-300",
  "bg-sky-500/20 text-sky-700 dark:text-sky-300",
  "bg-violet-500/20 text-violet-700 dark:text-violet-300",
  "bg-rose-500/20 text-rose-700 dark:text-rose-300",
  "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
  "bg-amber-500/20 text-amber-700 dark:text-amber-300",
  "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300",
  "bg-pink-500/20 text-pink-700 dark:text-pink-300",
];

/** Deterministic avatar color per member name, stable across renders. */
export function getAvatarColorClasses(name: string): string {
  const normalized = name.trim().toLowerCase();
  if (!normalized) return AVATAR_COLOR_CLASSES[0];
  return AVATAR_COLOR_CLASSES[hashString(normalized) % AVATAR_COLOR_CLASSES.length];
}
