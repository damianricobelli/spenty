import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import type { SplitDebt } from "@/api/splits";
import type { ExpensesToolbarMember } from "@/components/expenses-toolbar/types";
import type { HistoryFiltersSearch } from "@/lib/history-filters-search";
import { springGentle } from "@/lib/motion";
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
  groupName: string;
  groupCode: string;
  members: ExpensesToolbarMember[];
  expense: ExpenseItem[];
  debts?: SplitDebt[];
  historyFilters: HistoryFiltersSearch;
  onHistoryFilterChange: (patch: Partial<HistoryFiltersSearch>) => void;
};

function StaggeredSection({
  index,
  children,
  className,
}: {
  index: number;
  children: ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return <div className={className}>{children}</div>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springGentle, delay: index * 0.05 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function ExpensesContent({
  groupId,
  groupName,
  groupCode,
  members,
  expense,
  debts = [],
  historyFilters,
  onHistoryFilterChange,
}: ExpensesContentProps) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-6">
      {/* Members */}
      <StaggeredSection index={0}>
        <MembersSection />
      </StaggeredSection>

      {/* Total */}
      <StaggeredSection index={1}>
        <TotalsSection expense={expense} />
      </StaggeredSection>

      {/* Who owes whom (splits only) */}
      {debts.length > 0 && (
        <StaggeredSection index={2}>
          <DebtsSection debts={debts} />
        </StaggeredSection>
      )}

      {/* History */}
      <StaggeredSection index={3} className="flex min-h-0 flex-1 flex-col">
        <HistorySection
          expense={expense}
          historyFilters={historyFilters}
          onHistoryFilterChange={onHistoryFilterChange}
          groupId={groupId}
          groupName={groupName}
          groupCode={groupCode}
          members={members}
        />
      </StaggeredSection>
    </div>
  );
}
