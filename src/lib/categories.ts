import {
  Car,
  Gamepad2,
  Heart,
  Home,
  type LucideIcon,
  MoreHorizontal,
  Repeat,
  ShoppingBag,
  UtensilsCrossed,
} from "lucide-react";
import { m } from "@/paraglide/messages";

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  food: UtensilsCrossed,
  transport: Car,
  housing: Home,
  health: Heart,
  entertainment: Gamepad2,
  shopping: ShoppingBag,
  subscriptions: Repeat,
  other: MoreHorizontal,
};

/**
 * Message functions are resolved on every call (not at import time) so the
 * label always matches the locale of the current request or page.
 */
const CATEGORY_MESSAGES = {
  food: m.category_food,
  transport: m.category_transport,
  housing: m.category_housing,
  health: m.category_health,
  entertainment: m.category_entertainment,
  shopping: m.category_shopping,
  subscriptions: m.category_subscriptions,
  other: m.category_other,
} as const;

export const BASE_CATEGORIES = Object.keys(CATEGORY_MESSAGES) as Array<
  keyof typeof CATEGORY_MESSAGES
>;

export function isBaseCategory(
  value: string,
): value is keyof typeof CATEGORY_MESSAGES {
  return Object.hasOwn(CATEGORY_MESSAGES, value);
}

export function getCategoryIcon(category: string): LucideIcon {
  return CATEGORY_ICONS[category] ?? MoreHorizontal;
}

export function getCategoryLabel(rawCategory: string): string {
  const category = rawCategory.trim();
  if (isBaseCategory(category)) return CATEGORY_MESSAGES[category]();
  if (category.startsWith("category_")) {
    const normalized = category.replace("category_", "");
    if (isBaseCategory(normalized)) return CATEGORY_MESSAGES[normalized]();
    return normalized.replaceAll("_", " ");
  }
  return category;
}

const CATEGORY_COLOR_CLASSES: Record<string, string> = {
  food: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  transport: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  housing: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  health: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
  entertainment: "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-400",
  shopping: "bg-pink-500/15 text-pink-700 dark:text-pink-400",
  subscriptions: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400",
  other: "bg-muted text-muted-foreground",
};

const CATEGORY_COLOR_POOL = [
  CATEGORY_COLOR_CLASSES.food,
  CATEGORY_COLOR_CLASSES.transport,
  CATEGORY_COLOR_CLASSES.housing,
  CATEGORY_COLOR_CLASSES.health,
  CATEGORY_COLOR_CLASSES.entertainment,
  CATEGORY_COLOR_CLASSES.shopping,
  CATEGORY_COLOR_CLASSES.subscriptions,
];

export function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Stable color pairing for a category; custom categories get a hashed hue. */
export function getCategoryColorClasses(category: string): string {
  const key = category.trim();
  if (CATEGORY_COLOR_CLASSES[key]) return CATEGORY_COLOR_CLASSES[key];
  if (!key) return CATEGORY_COLOR_CLASSES.other;
  return CATEGORY_COLOR_POOL[hashString(key.toLowerCase()) % CATEGORY_COLOR_POOL.length];
}
