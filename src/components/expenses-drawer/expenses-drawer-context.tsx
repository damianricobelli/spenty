import { createContext, useContext } from "react";

type ExpensesDrawerActions = {
	openAddMember: () => void;
	openEditMember: (memberId: string) => void;
	openEditExpense: (expenseId: string) => void;
};

const ExpensesDrawerActionsContext =
	createContext<ExpensesDrawerActions | null>(null);

export function ExpensesDrawerProvider({
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
		<ExpensesDrawerActionsContext.Provider
			value={{ openAddMember, openEditMember, openEditExpense }}
		>
			{children}
		</ExpensesDrawerActionsContext.Provider>
	);
}

export function useExpensesDrawerActions(): ExpensesDrawerActions | null {
  return useContext(ExpensesDrawerActionsContext);
}
