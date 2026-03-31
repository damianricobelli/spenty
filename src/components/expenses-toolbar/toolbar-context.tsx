import { createContext, useContext } from "react";

type ExpensesToolbarActions = {
  openAddMember: () => void;
  openEditMember: (memberId: string) => void;
  openEditExpense: (expenseId: string) => void;
};

const ExpensesToolbarActionsContext =
  createContext<ExpensesToolbarActions | null>(null);

export function ExpensesToolbarProvider({
  children,
  openAddMember,
  openEditMember,
  openEditExpense,
}: {
  children: React.ReactNode;
  openAddMember: () => void;
  openEditMember: (memberId: string) => void;
  openEditExpense: (expenseId: string) => void;
}) {
  return (
    <ExpensesToolbarActionsContext.Provider
      value={{ openAddMember, openEditMember, openEditExpense }}
    >
      {children}
    </ExpensesToolbarActionsContext.Provider>
  );
}

export function useExpensesToolbarActions(): ExpensesToolbarActions | null {
  return useContext(ExpensesToolbarActionsContext);
}
