import type { LucideIcon } from "lucide-react";
import {
	ArrowRightIcon,
	Car,
	ChevronDownIcon,
	EyeIcon,
	FilterIcon,
	Gamepad2,
	Heart,
	Home,
	MoreHorizontal,
	PencilIcon,
	ReceiptIcon,
	Repeat,
	ShoppingBag,
	Trash2Icon,
	UtensilsCrossed,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { SplitDebt } from "@/api/splits";
import { useExpensesDrawerActions } from "@/components/expenses-drawer";
import type { ExpensesDrawerMember } from "@/components/expenses-drawer/types";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useDeleteExpense } from "@/hooks/expenses/use-delete-expense";
import { useDeleteMember } from "@/hooks/members/use-delete-member";
import { formatCurrency } from "@/lib/format-currency";
import { formatDate } from "@/lib/format-date";
import {
	HISTORY_CATEGORY_VALUES,
	type HistoryCategory,
	type HistoryFiltersSearch,
} from "@/lib/history-filters-search";
import { m } from "@/paraglide/messages";
import { getLocale } from "@/paraglide/runtime";
import { ButtonWithSpinner } from "../button-with-spinner";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "../ui/empty";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
	food: UtensilsCrossed,
	transport: Car,
	housing: Home,
	health: Heart,
	entertainment: Gamepad2,
	shopping: ShoppingBag,
	subscriptions: Repeat,
	other: MoreHorizontal,
};

function getCategoryIcon(category: string) {
	return CATEGORY_ICONS[category] ?? MoreHorizontal;
}

function getMonthKey(date: Date) {
	const y = date.getFullYear();
	const m = date.getMonth() + 1;
	return `${y}-${String(m).padStart(2, "0")}`;
}

function useExpenseTotals(expense: ExpenseItem[]) {
	return useMemo(() => {
		const now = new Date();
		const thisMonthKey = getMonthKey(now);
		let totalAll = 0;
		let totalThisMonth = 0;
		const totalByMonth = new Map<string, number>();
		const monthKeys = new Set<string>([thisMonthKey]);

		for (const e of expense) {
			totalAll += e.amount;
			const key = e.expense_date ? e.expense_date.slice(0, 7) : null;
			if (key) monthKeys.add(key);
			if (key === thisMonthKey) totalThisMonth += e.amount;
			if (key) totalByMonth.set(key, (totalByMonth.get(key) ?? 0) + e.amount);
		}

		const sortedMonths = Array.from(monthKeys).sort().reverse();
		return {
			totalAll,
			totalThisMonth,
			totalByMonth,
			sortedMonths,
		};
	}, [expense]);
}

type ExpenseItem = {
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
	members: ExpensesDrawerMember[];
	expense: ExpenseItem[];
	routeType: "expenses" | "splits";
	debts?: SplitDebt[];
	historyFilters: HistoryFiltersSearch;
	onHistoryFilterChange: (patch: Partial<HistoryFiltersSearch>) => void;
};

const categoryLabels: Record<string, string> = {
	food: m.category_food(),
	transport: m.category_transport(),
	housing: m.category_housing(),
	health: m.category_health(),
	entertainment: m.category_entertainment(),
	shopping: m.category_shopping(),
	subscriptions: m.category_subscriptions(),
	other: m.category_other(),
};

const getCategoryLabel = (category: string) =>
	categoryLabels[category] ?? category;

const getMonthLabel = (monthKey: string) => {
	if (monthKey === getMonthKey(new Date())) return m.content_total_this_month();
	const [y, mo] = monthKey.split("-").map(Number);
	return formatDate(new Date(y, mo - 1, 1), "MMMM yyyy");
};

export function ExpensesContent({
	groupId,
	members,
	expense,
	routeType,
	debts = [],
	historyFilters,
	onHistoryFilterChange,
}: ExpensesContentProps) {
	const drawerActions = useExpensesDrawerActions();
	const deleteMemberIdRef = useRef<string>(null);
	const deleteExpenseIdRef = useRef<string>(null);

	const [isDeleteMemberDialogOpen, setIsDeleteMemberDialogOpen] =
		useState(false);
	const [isDeleteExpenseDialogOpen, setIsDeleteExpenseDialogOpen] =
		useState(false);
	const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(
		null,
	);

	const deleteMemberMutation = useDeleteMember(groupId, {
		onSuccess: () => {
			deleteMemberIdRef.current = null;
			setIsDeleteMemberDialogOpen(false);
		},
	});

	const deleteExpenseMutation = useDeleteExpense(groupId, {
		onSuccess: () => {
			deleteExpenseIdRef.current = null;
			setIsDeleteExpenseDialogOpen(false);
		},
	});

	const { totalAll, totalThisMonth, totalByMonth, sortedMonths } =
		useExpenseTotals(expense);
	const [compareMonthKey, setCompareMonthKey] = useState<string | null>(null);
	const memberById = new Map(members.map((m) => [m.id, m.name]));

	const compareMonthTotal = compareMonthKey
		? (totalByMonth.get(compareMonthKey) ?? 0)
		: 0;
	const compareLabel =
		compareMonthKey &&
		(() => {
			const [y, m] = compareMonthKey.split("-").map(Number);
			return formatDate(new Date(y, m - 1, 1), "MMMM yyyy");
		})();
	const diffPctValue =
		compareMonthTotal > 0
			? ((totalThisMonth - compareMonthTotal) / compareMonthTotal) * 100
			: totalThisMonth > 0
				? 100
				: 0;
	const formattedPct = Math.abs(diffPctValue).toLocaleString(getLocale(), {
		minimumFractionDigits: 0,
		maximumFractionDigits: 1,
	});

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
			if (
				historyFilters.historyMonths.length &&
				!historyFilters.historyMonths.includes(monthKey ?? "")
			) {
				return false;
			}
			if (
				historyFilters.historyCategories.length &&
				!historyFilters.historyCategories.includes(e.category as HistoryCategory)
			) {
				return false;
			}
			if (
				historyFilters.historyPaidBy.length &&
				!historyFilters.historyPaidBy.includes(e.paid_by)
			) {
				return false;
			}
			return true;
		});
	}, [expense, historyFilters]);

	const sortedAndGroupedExpenses = useMemo(() => {
		const sorted = [...filteredExpenses].sort((a, b) => {
			const dateA = a.expense_date ?? a.created_at ?? "";
			const dateB = b.expense_date ?? b.created_at ?? "";
			if (dateA !== dateB) return dateB.localeCompare(dateA);
			return (b.created_at ?? "").localeCompare(a.created_at ?? "");
		});
		const byMonth = new Map<string, ExpenseItem[]>();
		for (const e of sorted) {
			const key = e.expense_date
				? e.expense_date.slice(0, 7)
				: e.created_at
					? e.created_at.slice(0, 7)
					: "—";
			const list = byMonth.get(key) ?? [];
			list.push(e);
			byMonth.set(key, list);
		}
		const keys = Array.from(byMonth.keys()).sort().reverse();
		return { byMonth, monthKeys: keys };
	}, [filteredExpenses]);

	const handleConfirmDeleteMember = () => {
		const memberId = deleteMemberIdRef.current;
		if (!memberId) return;
		deleteMemberMutation.mutate({ groupId, memberId });
	};

	const handleConfirmDeleteExpense = () => {
		const expenseId = deleteExpenseIdRef.current;
		if (!expenseId) return;
		deleteExpenseMutation.mutate({ groupId, expenseId });
	};

	const toggleMonthFilter = (monthKey: string, checked: boolean) => {
		const nextValues = checked
			? Array.from(new Set([...historyFilters.historyMonths, monthKey]))
			: historyFilters.historyMonths.filter((value) => value !== monthKey);
		onHistoryFilterChange({
			historyMonths: nextValues,
		});
	};

	const toggleCategoryFilter = (category: HistoryCategory, checked: boolean) => {
		const nextValues = checked
			? Array.from(new Set([...historyFilters.historyCategories, category]))
			: historyFilters.historyCategories.filter((value) => value !== category);
		onHistoryFilterChange({
			historyCategories: nextValues,
		});
	};

	const togglePaidByFilter = (memberId: string, checked: boolean) => {
		const nextValues = checked
			? Array.from(new Set([...historyFilters.historyPaidBy, memberId]))
			: historyFilters.historyPaidBy.filter((value) => value !== memberId);
		onHistoryFilterChange({
			historyPaidBy: nextValues,
		});
	};

	return (
		<div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-6">
			{/* Members */}
			<section>
				<h2 className="mb-3 text-md font-medium text-muted-foreground">
					{m.content_section_members()}
				</h2>
				<div className="flex flex-wrap items-center gap-2">
					{members.map((member) => {
						const initial = member.name.trim().charAt(0).toUpperCase() || "?";
						return (
							<span
								key={member.id}
								className="bg-muted text-foreground border-border/60 group flex h-9 w-fit items-center gap-2 rounded-full border pl-1.5 pr-1 text-sm font-medium shadow-sm transition-shadow hover:shadow-md whitespace-nowrap"
							>
								<span className="bg-muted-foreground/15 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-foreground">
									{initial}
								</span>
								<span className="pr-0.5">{member.name}</span>
								<div className="flex items-center gap-0">
									{drawerActions && (
										<Button
											type="button"
											variant="ghost"
											size="icon-xs"
											className="shrink-0 rounded-full opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10"
											aria-label={m.content_edit()}
											onClick={() => drawerActions.openEditMember(member.id)}
										>
											<PencilIcon className="size-3.5" />
										</Button>
									)}
									<Button
										type="button"
										variant="ghost"
										size="icon-xs"
										className="shrink-0 rounded-full opacity-60 hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
										aria-label={m.content_delete()}
										onClick={() => {
											deleteMemberIdRef.current = member.id;
											setIsDeleteMemberDialogOpen(true);
										}}
									>
										<Trash2Icon className="size-3.5" />
									</Button>
								</div>
							</span>
						);
					})}
				</div>
			</section>

			{/* Total */}
			<section>
				<h2 className="mb-3 text-md font-medium text-muted-foreground">
					{m.content_section_total()}
				</h2>
				<div className="overflow-hidden rounded-2xl border border-border/50 shadow-sm">
					<div className="grid grid-cols-1 divide-y divide-border/50 sm:grid-cols-2 sm:divide-y-0 sm:divide-x">
						<div className="min-w-0 overflow-hidden px-4 py-4">
							<p className="text-muted-foreground truncate text-xs font-medium uppercase tracking-wider">
								{m.content_total_this_month()}
							</p>
							<p className="mt-1 truncate text-lg font-semibold tabular-nums tracking-tight sm:text-2xl">
								{formatCurrency(totalThisMonth)}
							</p>
						</div>
						<div className="min-w-0 overflow-hidden px-4 py-4">
							<p className="text-muted-foreground truncate text-xs font-medium uppercase tracking-wider">
								{m.content_total_all()}
							</p>
							<p className="mt-1 truncate text-lg font-semibold tabular-nums tracking-tight sm:text-2xl">
								{formatCurrency(totalAll)}
							</p>
						</div>
					</div>
					{sortedMonths.length > 1 && (
						<div className="border-t border-border/50 px-4 py-3">
							<div className="flex flex-col gap-3">
								<div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
									<span className="text-muted-foreground shrink-0 text-sm">
										{m.content_compare_with()}
									</span>
									<Select
										value={compareMonthKey ?? ""}
										onValueChange={(v) => setCompareMonthKey(v || null)}
									>
										<SelectTrigger size="sm" className="h-8 w-full min-w-0">
											<SelectValue
												placeholder={m.content_compare_placeholder()}
											/>
										</SelectTrigger>
										<SelectContent align="start">
											{sortedMonths
												.filter((k) => k !== getMonthKey(new Date()))
												.map((key) => {
													const [y, m] = key.split("-").map(Number);
													const label = formatDate(
														new Date(y, m - 1, 1),
														"MMMM yyyy",
													);
													return (
														<SelectItem key={key} value={key}>
															{label} (
															{formatCurrency(totalByMonth.get(key) ?? 0)})
														</SelectItem>
													);
												})}
										</SelectContent>
									</Select>
								</div>
								{compareLabel != null && (
									<p
										className={
											diffPctValue > 0
												? "text-destructive text-sm"
												: diffPctValue < 0
													? "text-emerald-600 dark:text-emerald-400 text-sm"
													: "text-muted-foreground text-sm"
										}
									>
										{diffPctValue > 0
											? m.content_vs_month_more({
													month: compareLabel,
													pct: formattedPct,
												})
											: diffPctValue < 0
												? m.content_vs_month_less({
														month: compareLabel,
														pct: formattedPct,
													})
												: m.content_vs_month_same({ month: compareLabel })}
									</p>
								)}
							</div>
						</div>
					)}
				</div>
			</section>

			{/* Who owes whom (splits only) */}
			{routeType === "splits" && debts.length > 0 && (
				<section>
					<h2 className="mb-3 text-md font-medium text-muted-foreground">
						{m.content_section_who_owes()}
					</h2>
					<ul className="divide-y divide-border/50 overflow-hidden rounded-2xl border border-border/50 shadow-sm">
						{debts.map((d, i) => (
							<li
								key={`${d.fromMemberId}-${d.toMemberId}-${i}`}
								className="flex items-center justify-between gap-3 px-4 py-3"
							>
								<div className="min-w-0 flex-1 text-sm">
									<p className="font-medium text-foreground">
										<span>{d.fromName}</span>
										<ArrowRightIcon
											className="mx-1.5 inline-block size-3.5 shrink-0 align-middle text-muted-foreground"
											aria-hidden
										/>
										<span>{d.toName}</span>
									</p>
								</div>
								<span className="shrink-0 text-sm font-semibold tabular-nums tracking-tight">
									{formatCurrency(d.amount)}
								</span>
							</li>
						))}
					</ul>
				</section>
			)}

			{/* History */}
			<section className="flex min-h-0 flex-1 flex-col pb-24">
				<div className="mb-3 flex items-center justify-between gap-3">
					<h2 className="text-md font-medium text-muted-foreground">
						{m.content_section_history()}
					</h2>
					<DropdownMenu>
						<DropdownMenuTrigger
							render={<Button variant="outline" size="sm" />}
						>
							<FilterIcon className="size-4" />
							Filtros
							<ChevronDownIcon className="size-4 opacity-60" />
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-56">
							<DropdownMenuSub>
								<DropdownMenuSubTrigger>Mes</DropdownMenuSubTrigger>
								<DropdownMenuSubContent>
									{monthOptions.map((monthKey) => (
										<DropdownMenuCheckboxItem
											key={monthKey}
											checked={historyFilters.historyMonths.includes(monthKey)}
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
								<DropdownMenuSubTrigger>Categoría</DropdownMenuSubTrigger>
								<DropdownMenuSubContent>
									{categoryOptions.map((category) => (
										<DropdownMenuCheckboxItem
											key={category}
											checked={historyFilters.historyCategories.includes(category)}
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
								<DropdownMenuSubTrigger>Pagado por</DropdownMenuSubTrigger>
								<DropdownMenuSubContent>
									{paidByOptions.map((member) => (
										<DropdownMenuCheckboxItem
											key={member.id}
											checked={historyFilters.historyPaidBy.includes(member.id)}
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
										historyMonths: [],
										historyCategories: [],
										historyPaidBy: [],
									})
								}
							>
								Limpiar filtros
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
				{expense.length === 0 ? (
					<div className="flex flex-1 flex-col items-center justify-center py-12">
						<Empty className="w-full">
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<ReceiptIcon />
								</EmptyMedia>
								<EmptyTitle>{m.empty_no_expenses()}</EmptyTitle>
								<EmptyDescription className="sr-only">
									{m.empty_no_expenses()}
								</EmptyDescription>
							</EmptyHeader>
						</Empty>
					</div>
					) : (
						<div className="flex min-h-0 flex-1 flex-col overflow-auto">
							{filteredExpenses.length === 0 ? (
								<div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 px-4 py-16 text-center text-sm text-muted-foreground">
									No hay movimientos para los filtros seleccionados.
								</div>
							) : (
								<ul className="divide-y divide-border/50 overflow-hidden rounded-2xl border border-border/50 shadow-sm">
									{sortedAndGroupedExpenses.monthKeys.map((monthKey) => {
										const monthExpenses =
											sortedAndGroupedExpenses.byMonth.get(monthKey) ?? [];
										const monthLabel = getMonthLabel(monthKey);
										return (
											<li key={monthKey}>
												<div className="bg-muted/30 sticky top-0 z-10 px-3 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
													{monthLabel}
												</div>
												<ul className="divide-y divide-border/50">
													{monthExpenses.map((e) => {
														const isExpanded = expandedExpenseId === e.id;
														const CategoryIcon = getCategoryIcon(e.category);
														const primaryText =
															[
																e.category ? getCategoryLabel(e.category) : null,
																e.description,
															]
																.filter(Boolean)
																.join(" · ") || "—";
														return (
															<li
																key={e.id}
																className="transition-colors hover:bg-muted/30"
															>
																<div className="flex items-start justify-between gap-2 px-3 py-2.5">
															<div className="flex min-w-0 flex-1 items-start gap-2">
																<span className="text-muted-foreground mt-0.5 shrink-0">
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
																	<p className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5 text-xs text-muted-foreground">
																		{e.expense_date && (
																			<span>
																				{formatDate(
																					new Date(
																						`${e.expense_date}T12:00:00`,
																					),
																					"PPP",
																				)}
																			</span>
																		)}
																		<span>·</span>
																		<span>
																			{memberById.get(e.paid_by) ?? "—"}
																		</span>
																		{e.paid_to_member_ids?.length ? (
																			<>
																				<span>
																					{m.content_history_paid_to()}
																				</span>
																				<span className="inline-flex flex-wrap gap-x-1 gap-y-0.5">
																					{e.paid_to_member_ids.map((id) => (
																						<span
																							key={id}
																							className="rounded-md bg-muted/80 px-1.5 py-0.5 text-xs font-medium text-foreground/90"
																						>
																							{memberById.get(id) ?? id}
																						</span>
																					))}
																				</span>
																			</>
																		) : null}
																	</p>
																</div>
															</div>
															<div className="flex shrink-0 items-center gap-0.5">
																<Button
																	type="button"
																	variant="ghost"
																	size="icon-xs"
																	className="shrink-0 rounded-full opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10"
																	aria-label={m.content_view_details()}
																	aria-expanded={isExpanded}
																	onClick={() =>
																		setExpandedExpenseId((id) =>
																			id === e.id ? null : e.id,
																		)
																	}
																>
																	<EyeIcon className="size-3.5" />
																</Button>
																{drawerActions && (
																	<Button
																		type="button"
																		variant="ghost"
																		size="icon-xs"
																		className="shrink-0 rounded-full opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10"
																		aria-label={m.content_edit()}
																		onClick={() =>
																			drawerActions.openEditExpense(e.id)
																		}
																	>
																		<PencilIcon className="size-3.5" />
																	</Button>
																)}
																<Button
																	type="button"
																	variant="ghost"
																	size="icon-xs"
																	className="shrink-0 rounded-full opacity-60 hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
																	aria-label={m.content_delete()}
																	onClick={() => {
																		deleteExpenseIdRef.current = e.id;
																		setIsDeleteExpenseDialogOpen(true);
																	}}
																>
																	<Trash2Icon className="size-3.5" />
																</Button>
															</div>
														</div>
														{isExpanded && (
															<div className="border-t border-border/50 bg-muted/20 px-3 py-3 pl-9 text-sm">
																<dl className="grid gap-2 sm:grid-cols-2">
																	<div>
																		<dt className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
																			{m.drawer_field_amount()}
																		</dt>
																		<dd className="mt-0.5 font-semibold tabular-nums">
																			{formatCurrency(e.amount)}
																		</dd>
																	</div>
																	{e.expense_date && (
																		<div>
																			<dt className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
																				{m.drawer_field_payment_date()}
																			</dt>
																			<dd className="mt-0.5">
																				{formatDate(
																					new Date(
																						`${e.expense_date}T12:00:00`,
																					),
																					"PPP",
																				)}
																			</dd>
																		</div>
																	)}
																	<div className="sm:col-span-2">
																		<dt className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
																			{m.drawer_field_category()}
																		</dt>
																		<dd className="mt-0.5">
																			{e.category
																				? getCategoryLabel(e.category)
																				: "—"}
																		</dd>
																	</div>
																	{e.description && (
																		<div className="sm:col-span-2">
																			<dt className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
																				{m.drawer_field_description()}
																			</dt>
																			<dd className="mt-0.5">
																				{e.description}
																			</dd>
																		</div>
																	)}
																	<div className="sm:col-span-2">
																		<dt className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
																			{m.drawer_field_person()}
																		</dt>
																		<dd className="mt-0.5">
																			{memberById.get(e.paid_by) ?? "—"}
																		</dd>
																	</div>
																	{e.paid_to_member_ids?.length ? (
																		<div className="sm:col-span-2">
																			<dt className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
																				{m.drawer_field_paid_to()}
																			</dt>
																			<dd className="mt-0.5 inline-flex flex-wrap gap-1">
																				{e.paid_to_member_ids.map((id) => (
																					<span
																						key={id}
																						className="rounded-md bg-muted/80 px-1.5 py-0.5 text-xs font-medium"
																					>
																						{memberById.get(id) ?? id}
																					</span>
																				))}
																			</dd>
																		</div>
																	) : null}
																</dl>
															</div>
														)}
															</li>
														);
													})}
												</ul>
											</li>
										);
									})}
								</ul>
							)}
						</div>
					)}
				</section>

			{/* Delete member dialog */}
			<Dialog
				open={isDeleteMemberDialogOpen}
				onOpenChange={(open) => {
					if (!open) {
						deleteMemberIdRef.current = null;
						setIsDeleteMemberDialogOpen(false);
					}
				}}
			>
				<DialogContent showCloseButton={true}>
					<DialogHeader>
						<DialogTitle>{m.content_delete_member_title()}</DialogTitle>
						<DialogDescription>
							{m.content_delete_member_description()}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter showCloseButton={false}>
						<Button
							variant="ghost"
							onClick={() => setIsDeleteMemberDialogOpen(false)}
							disabled={deleteMemberMutation.isPending}
						>
							{m.content_cancel()}
						</Button>
						<ButtonWithSpinner
							type="button"
							isPending={deleteMemberMutation.isPending}
							text={m.content_delete()}
							onClick={handleConfirmDeleteMember}
						/>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete expense dialog */}
			<Dialog
				open={isDeleteExpenseDialogOpen}
				onOpenChange={(open) => {
					if (!open) {
						deleteExpenseIdRef.current = null;
						setIsDeleteExpenseDialogOpen(false);
					}
				}}
			>
				<DialogContent showCloseButton={true}>
					<DialogHeader>
						<DialogTitle>{m.content_delete_expense_title()}</DialogTitle>
						<DialogDescription>
							{m.content_delete_expense_description()}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter showCloseButton={false}>
						<Button
							variant="ghost"
							onClick={() => setIsDeleteExpenseDialogOpen(false)}
							disabled={deleteExpenseMutation.isPending}
						>
							{m.content_cancel()}
						</Button>
						<ButtonWithSpinner
							type="button"
							isPending={deleteExpenseMutation.isPending}
							text={m.content_delete()}
							onClick={handleConfirmDeleteExpense}
						/>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
