import { createContext, use } from "react";

type ExpensesToolbarActions = {
	openAddExpense: () => void;
	openAddMember: () => void;
	openEditMember: (memberId: string) => void;
	openEditExpense: (expenseId: string) => void;
};

const ExpensesToolbarActionsContext =
	createContext<ExpensesToolbarActions | null>(null);

export function ExpensesToolbarProvider({
	children,
	...actions
}: ExpensesToolbarActions & { children: React.ReactNode }) {
	return (
		<ExpensesToolbarActionsContext value={actions}>
			{children}
		</ExpensesToolbarActionsContext>
	);
}

export function useExpensesToolbarActions(): ExpensesToolbarActions | null {
	return use(ExpensesToolbarActionsContext);
}
