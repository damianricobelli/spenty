import type { LucideIcon } from "lucide-react";
import {
	Car,
	ChevronDownIcon,
	DownloadIcon,
	EyeIcon,
	FilterIcon,
	Gamepad2,
	Heart,
	Home,
	MoreHorizontal,
	PencilIcon,
	ReceiptIcon,
	Repeat,
	SearchIcon,
	ShoppingBag,
	Trash2Icon,
	UtensilsCrossed,
} from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useExpensesToolbarActions } from "@/components/expenses-toolbar";
import type { ExpensesToolbarMember } from "@/components/expenses-toolbar/types";
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
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import { useDeleteExpense } from "@/hooks/expenses/use-delete-expense";
import { cn } from "@/lib/cn";
import { exportExpensesToExcel } from "@/lib/export-expenses-excel";
import { formatCurrency } from "@/lib/format-currency";
import { formatDate } from "@/lib/format-date";
import {
	HISTORY_CATEGORY_VALUES,
	type HistoryCategory,
	type HistoryFiltersSearch,
} from "@/lib/history-filters-search";
import { m } from "@/paraglide/messages";
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
	groupId,
	groupName,
	groupCode,
	members,
	expense,
	historyFilters,
	onHistoryFilterChange,
}: ExpensesContentProps) {
	const toolbarActions = useExpensesToolbarActions();
	const deleteExpenseIdRef = useRef<string>(null);
	const selectedMonths = historyFilters.months ?? [];
	const selectedCategories = historyFilters.categories ?? [];
	const selectedPaidBy = historyFilters.paidBy ?? [];
	const selectedSearchTerm = historyFilters.search ?? "";
	const deferredSearchTerm = useDeferredValue(selectedSearchTerm);
	const normalizedSearchTerm = normalizeHistorySearchText(deferredSearchTerm);

	const [isDeleteExpenseDialogOpen, setIsDeleteExpenseDialogOpen] =
		useState(false);
	const [isExporting, setIsExporting] = useState(false);
	const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(
		null,
	);
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

	const deleteExpenseMutation = useDeleteExpense(groupId, {
		onSuccess: () => {
			deleteExpenseIdRef.current = null;
			setIsDeleteExpenseDialogOpen(false);
		},
	});

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

	const handleConfirmDeleteExpense = () => {
		const expenseId = deleteExpenseIdRef.current;
		if (!expenseId) return;
		deleteExpenseMutation.mutate({ groupId, expenseId });
	};

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

	return (
		<>
			<section className="flex min-h-0 flex-1 flex-col pb-24">
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
											: "!flex-none w-0 min-w-0 px-0 opacity-0 pointer-events-none",
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
								disabled={!canExport || isExporting}
								onClick={handleExportExcel}
							>
								<DownloadIcon className="size-4" />
								Excel
							</Button>
							<DropdownMenu>
								<DropdownMenuTrigger
									render={<Button variant="outline" size="sm" />}
								>
									<FilterIcon className="size-4" />
									{m.history_filter_button()}
									<ChevronDownIcon className="size-4 opacity-60" />
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
				{hasNoExpenses ? (
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
								{m.history_filter_no_results()}
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
																	{toolbarActions && (
																		<Button
																			type="button"
																			variant="ghost"
																			size="icon-xs"
																			className="shrink-0 rounded-full opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10"
																			aria-label={m.content_edit()}
																			onClick={() =>
																				toolbarActions.openEditExpense(e.id)
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
																				{m.toolbar_field_amount()}
																			</dt>
																			<dd className="mt-0.5 font-semibold tabular-nums">
																				{formatCurrency(e.amount)}
																			</dd>
																		</div>
																		{e.expense_date && (
																			<div>
																				<dt className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
																					{m.toolbar_field_payment_date()}
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
																				{m.toolbar_field_category()}
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
																					{m.toolbar_field_description()}
																				</dt>
																				<dd className="mt-0.5">
																					{e.description}
																				</dd>
																			</div>
																		)}
																		<div className="sm:col-span-2">
																			<dt className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
																				{m.toolbar_field_person()}
																			</dt>
																			<dd className="mt-0.5">
																				{memberById.get(e.paid_by) ?? "—"}
																			</dd>
																		</div>
																		{e.paid_to_member_ids?.length ? (
																			<div className="sm:col-span-2">
																				<dt className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
																					{m.toolbar_field_paid_to()}
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
		</>
	);
}

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

function getCategoryIcon(category: string) {
	return CATEGORY_ICONS[category] ?? MoreHorizontal;
}

function getMonthKey(date: Date) {
	const y = date.getFullYear();
	const m = date.getMonth() + 1;
	return `${y}-${String(m).padStart(2, "0")}`;
}

function normalizeHistorySearchText(value: string) {
	return value.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().trim();
}
