import type { SplitDebt } from "@/api/splits";
import type { ExpensesToolbarMember } from "@/components/expenses-toolbar/types";
import type { HistoryFiltersSearch } from "@/lib/history-filters-search";
import { DebtsSection } from "./debts-section";
import { HistorySection } from "./history-section";
import { MembersSection } from "./members-section";
import { TotalsSection } from "./totals-section";

export type ExpenseItem = {
	id: string;
	amount: number;
	category: string;
	description: string;
	paid_by: string;
	created_at: string | null;
	expense_date: string | null;
	paid_to_member_ids?: string[];
};

type ExpensesContentProps = {
	groupId: string;
	members: ExpensesToolbarMember[];
	expense: ExpenseItem[];
	debts?: SplitDebt[];
	historyFilters: HistoryFiltersSearch;
	onHistoryFilterChange: (patch: Partial<HistoryFiltersSearch>) => void;
};

export function ExpensesContent({
	groupId,
	members,
	expense,
	debts = [],
	historyFilters,
	onHistoryFilterChange,
}: ExpensesContentProps) {
	return (
		<div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-6">
			{/* Members */}
			<MembersSection />

			{/* Total */}
			<TotalsSection expense={expense} />

			{/* Who owes whom (splits only) */}
			<DebtsSection debts={debts} />

			{/* History */}
			<HistorySection
				expense={expense}
				historyFilters={historyFilters}
				onHistoryFilterChange={onHistoryFilterChange}
				groupId={groupId}
				members={members}
			/>
		</div>
	);
}
