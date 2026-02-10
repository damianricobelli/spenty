export const EXPENSES_DRAWER_VIEW = {
  ADD_MEMBER: "add_member",
  ADD_EXPENSE: "add_expense",
  EDIT_EXPENSE: "edit_expense",
  DEFAULT: "default",
} as const;

export type ExpensesDrawerView =
  (typeof EXPENSES_DRAWER_VIEW)[keyof typeof EXPENSES_DRAWER_VIEW];

export type ExpensesDrawerMember = { id: string; name: string };

export type ExpensesDrawerGroup = { id: string };