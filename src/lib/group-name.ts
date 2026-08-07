import { m } from "@/paraglide/messages";

/**
 * True when the group still has a placeholder name (never renamed by the
 * user), including legacy defaults from before the copy change.
 */
export function isDefaultGroupName(name: string): boolean {
  const normalized = name.trim().toLowerCase();
  if (!normalized) return true;
  return [
    m.create_default_expense_name().toLowerCase(),
    m.create_default_split_name().toLowerCase(),
    "expense name here",
    "split name here",
  ].includes(normalized);
}
