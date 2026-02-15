import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { getExpense } from "@/api/expenses";
import { getGroup } from "@/api/group";
import { getMembers } from "@/api/members";
import { getSplitDebts } from "@/api/splits";
import { EmptyNoMembers } from "@/components/empty-no-members";
import { ExpensesContent } from "@/components/expenses-content";
import {
	EXPENSES_TOOLBAR_VIEW,
	ExpensesToolbar,
	ExpensesToolbarProvider,
	type ExpensesToolbarView,
} from "@/components/expenses-toolbar";
import { Layout } from "@/components/layout";
import { PasswordDialog } from "@/components/password-dialog";
import { historyFiltersSearchSchema } from "@/lib/history-filters-search";
import { isGroupUnlocked } from "@/lib/unlocked-groups";

export const Route = createFileRoute("/splits/$id")({
	validateSearch: historyFiltersSearchSchema,
	component: RouteComponent,
	loader: async ({ params }) => {
		const { id } = params;
		const group = await getGroup({ data: { code: id } });
		const [members, expense, debts] = await Promise.all([
			getMembers({ data: { groupId: group.id } }),
			getExpense({ data: { groupId: group.id } }),
			getSplitDebts({ data: { groupId: group.id } }),
		]);
		return { group, members, expense, debts };
	},
});

function RouteComponent() {
	const { group, members, expense, debts } = Route.useLoaderData();
	const historyFilters = Route.useSearch();
	const navigate = Route.useNavigate();
	const [toolbarView, setToolbarView] = useState<ExpensesToolbarView>(
		EXPENSES_TOOLBAR_VIEW.DEFAULT,
	);
	const [editExpenseId, setEditExpenseId] = useState<string | null>(null);
	const [editMemberId, setEditMemberId] = useState<string | null>(null);

	if (group.password && !isGroupUnlocked(group.id)) {
		return (
			<main className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4">
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
								navigate({
									search: (prev) => {
										const next = {
											...prev,
											...patch,
										};

										return {
											...next,
											historyMonths:
												(next.historyMonths?.length ?? 0)
													? next.historyMonths
													: undefined,
											historyCategories:
												(next.historyCategories?.length ?? 0)
													? next.historyCategories
													: undefined,
											historyPaidBy:
												(next.historyPaidBy?.length ?? 0)
													? next.historyPaidBy
													: undefined,
										};
									},
									replace: true,
								})
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
