import { createContext, useContext } from "react";

type ExpensesDrawerActions = {
  openAddMember: () => void;
  openEditExpense: (expenseId: string) => void;
};

const ExpensesDrawerActionsContext = createContext<ExpensesDrawerActions | null>(
  null
);

export function ExpensesDrawerProvider({
  children,
  openAddMember,
  openEditExpense,
}: {
  children: React.ReactNode;
  openAddMember: () => void;
  openEditExpense: (expenseId: string) => void;
}) {
  return (
    <ExpensesDrawerActionsContext.Provider value={{ openAddMember, openEditExpense }}>
      {children}
    </ExpensesDrawerActionsContext.Provider>
  );
}

export function useExpensesDrawerActions(): ExpensesDrawerActions | null {
  return useContext(ExpensesDrawerActionsContext);
}
