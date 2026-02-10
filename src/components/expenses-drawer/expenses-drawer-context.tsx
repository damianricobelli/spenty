import { createContext, useContext } from "react";

type ExpensesDrawerActions = {
  openAddMember: () => void;
};

const ExpensesDrawerActionsContext = createContext<ExpensesDrawerActions | null>(
  null
);

export function ExpensesDrawerProvider({
  children,
  openAddMember,
}: {
  children: React.ReactNode;
  openAddMember: () => void;
}) {
  return (
    <ExpensesDrawerActionsContext.Provider value={{ openAddMember }}>
      {children}
    </ExpensesDrawerActionsContext.Provider>
  );
}

export function useExpensesDrawerActions(): ExpensesDrawerActions | null {
  return useContext(ExpensesDrawerActionsContext);
}
