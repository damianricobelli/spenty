export const EXPENSES_TOOLBAR_VIEW = {
  ADD_MEMBER: "add_member",
  EDIT_MEMBER: "edit_member",
  ADD_EXPENSE: "add_expense",
  EDIT_EXPENSE: "edit_expense",
  DEFAULT: "default",
} as const;

export type ExpensesToolbarView =
  (typeof EXPENSES_TOOLBAR_VIEW)[keyof typeof EXPENSES_TOOLBAR_VIEW];

export type ExpensesToolbarMember = { id: string; name: string };

export type ExpensesToolbarGroup = { id: string };
