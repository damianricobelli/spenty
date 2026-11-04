import { useState } from "react";
import type { SplitDebt } from "@/api/splits";
import { EmptyNoMembers } from "@/components/empty-no-members";
import {
	type ExpenseItem,
	ExpensesContent,
} from "@/components/expenses-content/expenses-content";
import { ExpensesToolbar } from "@/components/expenses-toolbar/toolbar";
import { ExpensesToolbarProvider } from "@/components/expenses-toolbar/toolbar-context";
import {
	EXPENSES_TOOLBAR_VIEW,
	type ExpensesToolbarMember,
	type ExpensesToolbarView,
} from "@/components/expenses-toolbar/types";
import { Layout } from "@/components/layout";
import { PasswordDialog } from "@/components/password-dialog";
import type { HistoryFiltersSearch } from "@/lib/history-filters-search";
import { isGroupUnlocked } from "@/lib/unlocked-groups";

type GroupPageProps = {
	group: { id: string; name: string; slug: string; password?: string | null };
	members: ExpensesToolbarMember[];
	expense: ExpenseItem[];
	debts?: SplitDebt[];
	historyFilters: HistoryFiltersSearch;
	onHistoryFiltersChange: (next: HistoryFiltersSearch) => void;
};

/** Drops empty values so the URL only carries filters that are in use. */
function cleanFilters(filters: HistoryFiltersSearch): HistoryFiltersSearch {
	return {
		...filters,
		months: filters.months?.length ? filters.months : undefined,
		categories: filters.categories?.length ? filters.categories : undefined,
		paidBy: filters.paidBy?.length ? filters.paidBy : undefined,
		search: filters.search?.trim() ? filters.search.trim() : undefined,
	};
}

/**
 * Shared screen for personal expense groups and split groups. The routes only
 * load data; everything the user sees and does lives here.
 */
export function GroupPage({
	group,
	members,
	expense,
	debts,
	historyFilters,
	onHistoryFiltersChange,
}: GroupPageProps) {
	const [toolbarView, setToolbarView] = useState<ExpensesToolbarView>(
		EXPENSES_TOOLBAR_VIEW.DEFAULT,
	);
	const [editExpenseId, setEditExpenseId] = useState<string | null>(null);
	const [editMemberId, setEditMemberId] = useState<string | null>(null);

	if (group.password && !isGroupUnlocked(group.id)) {
		return (
			<main className="relative flex min-h-dvh flex-col items-center justify-center bg-background px-4">
				<PasswordDialog defaultOpen={true} />
			</main>
		);
	}

	const showToolbar =
		members.length > 0 || toolbarView !== EXPENSES_TOOLBAR_VIEW.DEFAULT;

	const handleViewChange = (view: ExpensesToolbarView) => {
		setToolbarView(view);
		if (view === EXPENSES_TOOLBAR_VIEW.DEFAULT) {
			setEditExpenseId(null);
			setEditMemberId(null);
		}
	};

	return (
		<ExpensesToolbarProvider
			openAddMember={() => setToolbarView(EXPENSES_TOOLBAR_VIEW.ADD_MEMBER)}
			openAddExpense={() => setToolbarView(EXPENSES_TOOLBAR_VIEW.ADD_EXPENSE)}
			openEditMember={(id) => {
				setEditMemberId(id);
				setToolbarView(EXPENSES_TOOLBAR_VIEW.EDIT_MEMBER);
			}}
			openEditExpense={(id) => {
				setEditExpenseId(id);
				setToolbarView(EXPENSES_TOOLBAR_VIEW.EDIT_EXPENSE);
			}}
		>
			<Layout.Container>
				<Layout.Header />
				<section className="flex min-h-0 flex-1 flex-col">
					{members.length === 0 ? (
						<EmptyNoMembers />
					) : (
						<ExpensesContent
							groupId={group.id}
							groupName={group.name}
							groupCode={group.slug}
							members={members}
							expense={expense}
							debts={debts}
							historyFilters={historyFilters}
							onHistoryFilterChange={(patch) =>
								onHistoryFiltersChange(
									cleanFilters({ ...historyFilters, ...patch }),
								)
							}
						/>
					)}
				</section>
				{showToolbar && (
					<ExpensesToolbar
						view={toolbarView}
						onViewChange={handleViewChange}
						editExpenseId={editExpenseId}
						editMemberId={editMemberId}
					/>
				)}
			</Layout.Container>
		</ExpensesToolbarProvider>
	);
}
