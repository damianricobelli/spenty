import {
  ChevronDownIcon,
  DownloadIcon,
  FilterIcon,
  PlusIcon,
  ReceiptIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useExpensesToolbarActions } from "@/components/expenses-toolbar/toolbar-context";
import type { ExpensesToolbarMember } from "@/components/expenses-toolbar/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  getCategoryColorClasses,
  getCategoryIcon,
  getCategoryLabel,
  isSettlement,
} from "@/lib/categories";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format-currency";
import { formatDate } from "@/lib/format-date";
import {
  HISTORY_CATEGORY_VALUES,
  type HistoryCategory,
  type HistoryFiltersSearch,
} from "@/lib/history-filters-search";
import { expandPanel, listItem, reducedFade, springGentle } from "@/lib/motion";
import { m } from "@/paraglide/messages";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "../ui/empty";

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
  historyFilters: HistoryFiltersSearch;
  onHistoryFilterChange: (patch: Partial<HistoryFiltersSearch>) => void;
};

export function HistorySection({
  groupName,
  groupCode,
  members,
  expense,
  historyFilters,
  onHistoryFilterChange,
}: ExpensesContentProps) {
  const toolbarActions = useExpensesToolbarActions();
  const reduceMotion = useReducedMotion();
  const selectedMonths = historyFilters.months ?? [];
  const selectedCategories = historyFilters.categories ?? [];
  const selectedPaidBy = historyFilters.paidBy ?? [];
  const selectedSearchTerm = historyFilters.search ?? "";
  const deferredSearchTerm = useDeferredValue(selectedSearchTerm);
  const normalizedSearchTerm = normalizeHistorySearchText(deferredSearchTerm);

  const [isExporting, setIsExporting] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(
    () => selectedSearchTerm.length > 0,
  );
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedSearchTerm && !isSearchOpen) {
      setIsSearchOpen(true);
    }
  }, [isSearchOpen, selectedSearchTerm]);

  useEffect(() => {
    if (isSearchOpen) {
      searchInputRef.current?.focus();
    }
  }, [isSearchOpen]);

  const memberById = useMemo(
    () => new Map(members.map((member) => [member.id, member.name])),
    [members],
  );

  const monthOptions = useMemo(() => {
    const keys = new Set<string>();
    for (const e of expense) {
      const key = e.expense_date?.slice(0, 7) ?? e.created_at?.slice(0, 7);
      if (key) keys.add(key);
    }
    return Array.from(keys).sort().reverse();
  }, [expense]);

  const categoryOptions = useMemo(() => {
    const values = new Set<HistoryCategory>();
    for (const e of expense) {
      if (HISTORY_CATEGORY_VALUES.includes(e.category as HistoryCategory)) {
        values.add(e.category as HistoryCategory);
      }
    }
    return Array.from(values).sort((a, b) =>
      getCategoryLabel(a).localeCompare(getCategoryLabel(b)),
    );
  }, [expense]);

  const paidByOptions = useMemo(() => {
    const payerIds = new Set(expense.map((e) => e.paid_by));
    return members
      .filter((member) => payerIds.has(member.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [expense, members]);

  const filteredExpenses = useMemo(() => {
    return expense.filter((e) => {
      const monthKey = e.expense_date?.slice(0, 7) ?? e.created_at?.slice(0, 7);
      if (selectedMonths.length && !selectedMonths.includes(monthKey ?? "")) {
        return false;
      }
      if (
        selectedCategories.length &&
        !selectedCategories.includes(e.category as HistoryCategory)
      ) {
        return false;
      }
      if (selectedPaidBy.length && !selectedPaidBy.includes(e.paid_by)) {
        return false;
      }
      if (normalizedSearchTerm) {
        const payerName = memberById.get(e.paid_by) ?? "";
        const searchableText = normalizeHistorySearchText(
          [
            e.description,
            e.category,
            getCategoryLabel(e.category),
            payerName,
            String(e.amount),
          ]
            .filter(Boolean)
            .join(" "),
        );
        if (!searchableText.includes(normalizedSearchTerm)) {
          return false;
        }
      }
      return true;
    });
  }, [
    expense,
    memberById,
    normalizedSearchTerm,
    selectedCategories,
    selectedMonths,
    selectedPaidBy,
  ]);

  const sortedAndGroupedExpenses = useMemo(() => {
    const sorted = [...filteredExpenses].sort((a, b) => {
      const dateA = a.expense_date ?? a.created_at ?? "";
      const dateB = b.expense_date ?? b.created_at ?? "";
      if (dateA !== dateB) return dateB.localeCompare(dateA);
      return (b.created_at ?? "").localeCompare(a.created_at ?? "");
    });
    const byMonth = new Map<string, ExpenseItem[]>();
    const totalByMonth = new Map<string, number>();
    for (const e of sorted) {
      const key = e.expense_date
        ? e.expense_date.slice(0, 7)
        : e.created_at
          ? e.created_at.slice(0, 7)
          : "—";
      const list = byMonth.get(key) ?? [];
      list.push(e);
      byMonth.set(key, list);
      if (!isSettlement(e.category)) {
        totalByMonth.set(key, (totalByMonth.get(key) ?? 0) + e.amount);
      }
    }
    const keys = Array.from(byMonth.keys()).sort().reverse();
    return { byMonth, totalByMonth, monthKeys: keys };
  }, [filteredExpenses]);

  const toggleMonthFilter = (monthKey: string, checked: boolean) => {
    const nextValues = checked
      ? Array.from(new Set([...selectedMonths, monthKey]))
      : selectedMonths.filter((value) => value !== monthKey);
    onHistoryFilterChange({
      months: nextValues.length ? nextValues : undefined,
    });
  };

  const toggleCategoryFilter = (
    category: HistoryCategory,
    checked: boolean,
  ) => {
    const nextValues = checked
      ? Array.from(new Set([...selectedCategories, category]))
      : selectedCategories.filter((value) => value !== category);
    onHistoryFilterChange({
      categories: nextValues.length ? nextValues : undefined,
    });
  };

  const togglePaidByFilter = (memberId: string, checked: boolean) => {
    const nextValues = checked
      ? Array.from(new Set([...selectedPaidBy, memberId]))
      : selectedPaidBy.filter((value) => value !== memberId);
    onHistoryFilterChange({
      paidBy: nextValues.length ? nextValues : undefined,
    });
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      // exceljs is large, so it only loads when someone actually exports.
      const { exportExpensesToExcel } = await import(
        "@/lib/export-expenses-excel"
      );
      await exportExpensesToExcel({
        groupName,
        groupCode,
        expenses: filteredExpenses,
        members,
      });
    } catch (error) {
      console.error("Error exporting expenses:", error);
      toast.error(m.history_export_excel_error());
    } finally {
      setIsExporting(false);
    }
  };

  const showFilters = members.length > 0 && expense.length > 0;
  const hasNoExpenses = expense.length === 0;
  const canExport = filteredExpenses.length > 0;

  // The React Compiler memoizes this; no manual useMemo needed.
  const activeFilterChips = (() => {
    const chips: Array<{ key: string; label: string; onRemove: () => void }> =
      [];
    for (const monthKey of selectedMonths) {
      chips.push({
        key: `month-${monthKey}`,
        label: getMonthLabel(monthKey),
        onRemove: () => toggleMonthFilter(monthKey, false),
      });
    }
    for (const category of selectedCategories) {
      chips.push({
        key: `category-${category}`,
        label: getCategoryLabel(category),
        onRemove: () => toggleCategoryFilter(category, false),
      });
    }
    for (const memberId of selectedPaidBy) {
      chips.push({
        key: `paidBy-${memberId}`,
        label: memberById.get(memberId) ?? memberId,
        onRemove: () => togglePaidByFilter(memberId, false),
      });
    }
    return chips;
  })();

  const rowTransition = reduceMotion ? reducedFade : springGentle;

  return (
    <section className="flex min-h-0 flex-1 flex-col pb-28">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-md font-medium text-muted-foreground">
            {m.content_section_history()}
          </h2>
          {showFilters && (
            <div className="flex flex-1 items-center justify-end gap-2">
              <InputGroup
                className={cn(
                  "shrink-0 overflow-hidden transition-[width] duration-250 ease-out",
                  isSearchOpen ? "w-40 h-8" : "size-8",
                )}
                onClick={() => setIsSearchOpen(true)}
              >
                <InputGroupInput
                  ref={searchInputRef}
                  type="search"
                  value={selectedSearchTerm}
                  onChange={(event) =>
                    onHistoryFilterChange({
                      search: event.currentTarget.value || undefined,
                    })
                  }
                  onBlur={() => {
                    if (!selectedSearchTerm) setIsSearchOpen(false);
                  }}
                  placeholder={m.history_filter_search_placeholder()}
                  className={cn(
                    isSearchOpen
                      ? ""
                      : "flex-none! w-0 min-w-0 px-0 opacity-0 pointer-events-none",
                  )}
                />
                <InputGroupAddon align="inline-end">
                  <SearchIcon />
                </InputGroupAddon>
              </InputGroup>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="size-8 px-0 sm:h-8 sm:w-auto sm:px-3"
                aria-label={m.history_export_excel_aria()}
                disabled={!canExport || isExporting}
                onClick={handleExportExcel}
              >
                <DownloadIcon className="size-4" />
                <span className="hidden sm:inline">Excel</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="outline"
                      size="sm"
                      className="size-8 px-0 sm:h-8 sm:w-auto sm:px-3"
                      aria-label={m.history_filter_button()}
                    />
                  }
                >
                  <FilterIcon className="size-4" />
                  <span className="hidden sm:inline">
                    {m.history_filter_button()}
                  </span>
                  <ChevronDownIcon className="hidden size-4 opacity-60 sm:inline" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      {m.history_filter_month()}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {monthOptions.map((monthKey) => (
                        <DropdownMenuCheckboxItem
                          key={monthKey}
                          checked={selectedMonths.includes(monthKey)}
                          onCheckedChange={(checked) =>
                            toggleMonthFilter(monthKey, Boolean(checked))
                          }
                        >
                          {getMonthLabel(monthKey)}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      {m.history_filter_category()}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {categoryOptions.map((category) => (
                        <DropdownMenuCheckboxItem
                          key={category}
                          checked={selectedCategories.includes(category)}
                          onCheckedChange={(checked) =>
                            toggleCategoryFilter(category, Boolean(checked))
                          }
                        >
                          {getCategoryLabel(category)}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      {m.history_filter_paid_by()}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {paidByOptions.map((member) => (
                        <DropdownMenuCheckboxItem
                          key={member.id}
                          checked={selectedPaidBy.includes(member.id)}
                          onCheckedChange={(checked) =>
                            togglePaidByFilter(member.id, Boolean(checked))
                          }
                        >
                          {member.name}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() =>
                      onHistoryFilterChange({
                        months: undefined,
                        categories: undefined,
                        paidBy: undefined,
                        search: undefined,
                      })
                    }
                  >
                    {m.history_filter_clear()}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Active filter chips */}
        <AnimatePresence initial={false}>
          {activeFilterChips.length > 0 && (
            <motion.div
              key="filter-chips"
              initial={expandPanel.initial}
              animate={expandPanel.animate}
              exit={expandPanel.exit}
              transition={rowTransition}
              className="overflow-hidden"
            >
              <div className="mb-3 flex flex-wrap items-center gap-1.5">
                <AnimatePresence initial={false}>
                  {activeFilterChips.map((chip) => (
                    <motion.button
                      key={chip.key}
                      type="button"
                      layout="position"
                      initial={listItem.initial}
                      animate={listItem.animate}
                      exit={listItem.exit}
                      transition={rowTransition}
                      onClick={chip.onRemove}
                      className="group flex items-center gap-1 rounded-full border border-border/70 bg-muted/50 py-1 pl-2.5 pr-1.5 text-xs font-medium text-foreground transition-colors hover:border-border hover:bg-muted"
                    >
                      {chip.label}
                      <XIcon className="size-3 text-muted-foreground transition-colors group-hover:text-foreground" />
                    </motion.button>
                  ))}
                </AnimatePresence>
                <button
                  type="button"
                  onClick={() =>
                    onHistoryFilterChange({
                      months: undefined,
                      categories: undefined,
                      paidBy: undefined,
                      search: undefined,
                    })
                  }
                  className="px-1.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {m.history_filter_clear()}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {hasNoExpenses ? (
          <div className="flex flex-1 flex-col items-center justify-center py-12">
            <Empty className="w-full">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ReceiptIcon />
                </EmptyMedia>
                <EmptyTitle>{m.empty_no_expenses()}</EmptyTitle>
                <EmptyDescription>{m.guide_step_expense()}</EmptyDescription>
              </EmptyHeader>
              {toolbarActions ? (
                <Button size="lg" onClick={toolbarActions.openAddExpense}>
                  <PlusIcon data-icon="inline-start" />
                  {m.toolbar_button_add_expense()}
                </Button>
              ) : null}
            </Empty>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-auto">
            {filteredExpenses.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 px-4 py-16 text-center text-sm text-muted-foreground">
                {m.history_filter_no_results()}
              </div>
            ) : (
              <ul className="divide-y divide-border/50 overflow-hidden rounded-2xl border border-border/50 shadow-sm">
                {sortedAndGroupedExpenses.monthKeys.map((monthKey) => {
                  const monthExpenses =
                    sortedAndGroupedExpenses.byMonth.get(monthKey) ?? [];
                  const monthTotal =
                    sortedAndGroupedExpenses.totalByMonth.get(monthKey) ?? 0;
                  const monthLabel = getMonthLabel(monthKey);
                  return (
                    <li key={monthKey}>
                      <div className="bg-muted/30 sticky top-0 z-10 flex items-baseline justify-between gap-3 px-3 py-2 backdrop-blur-sm">
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          {monthLabel}
                        </span>
                        <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                          {formatCurrency(monthTotal)}
                        </span>
                      </div>
                      <ul className="divide-y divide-border/50">
                        <AnimatePresence initial={false}>
                          {monthExpenses.map((e) => (
                            <HistoryRow
                              key={e.id}
                              expense={e}
                              memberById={memberById}
                              transition={rowTransition}
                              reduceMotion={Boolean(reduceMotion)}
                              onOpen={() => toolbarActions?.openEditExpense(e.id)}
                            />
                          ))}
                        </AnimatePresence>
                      </ul>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
    </section>
  );
}

type HistoryRowProps = {
  expense: ExpenseItem;
  memberById: Map<string, string>;
  transition: typeof springGentle;
  reduceMotion: boolean;
  onOpen: () => void;
};

function HistoryRow({
  expense: e,
  memberById,
  transition,
  reduceMotion,
  onOpen,
}: HistoryRowProps) {
  const CategoryIcon = getCategoryIcon(e.category);
  const settlement = isSettlement(e.category);
  const payerName = memberById.get(e.paid_by) ?? "—";
  const primaryText = settlement
    ? m.debts_settled_toast({
        from: payerName,
        to: memberById.get(e.paid_to_member_ids?.[0] ?? "") ?? "—",
      })
    : e.description?.trim() ||
      (e.category ? getCategoryLabel(e.category) : "—");
  const paidToNames = e.paid_to_member_ids
    ?.map((id) => memberById.get(id))
    .filter(Boolean)
    .join(", ");

  return (
    <motion.li
      layout={reduceMotion ? false : "position"}
      initial={reduceMotion ? { opacity: 0 } : listItem.initial}
      animate={listItem.animate}
      exit={reduceMotion ? { opacity: 0 } : listItem.exit}
      transition={transition}
      className="bg-background"
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors duration-150 hover:bg-muted/40 active:bg-muted/60"
      >
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full",
            getCategoryColorClasses(e.category),
          )}
        >
          <CategoryIcon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-sm font-medium text-foreground">
              {primaryText}
            </p>
            <span className="shrink-0 text-sm font-semibold tabular-nums tracking-tight">
              {formatCurrency(e.amount)}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {[
              settlement ? m.category_settlement() : payerName,
              paidToNames && !settlement
                ? `${m.content_history_paid_to()} ${paidToNames}`
                : null,
              e.expense_date
                ? formatDate(new Date(`${e.expense_date}T12:00:00`), "d MMM")
                : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </button>
    </motion.li>
  );
}

const getMonthLabel = (monthKey: string) => {
  if (monthKey === getMonthKey(new Date())) return m.content_total_this_month();
  const [y, mo] = monthKey.split("-").map(Number);
  return formatDate(new Date(y, mo - 1, 1), "MMMM yyyy");
};

function getMonthKey(date: Date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  return `${y}-${String(m).padStart(2, "0")}`;
}

function normalizeHistorySearchText(value: string) {
  return value.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().trim();
}
