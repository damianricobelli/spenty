import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { formatCurrency } from "@/lib/format-currency";
import { formatDate } from "@/lib/format-date";
import { m } from "@/paraglide/messages";
import { getLocale } from "@/paraglide/runtime";
import type { ExpenseItem } from "./expenses-content";

export function TotalsSection({ expense }: { expense: ExpenseItem[] }) {
	const [open, setOpen] = useState(false);
	const summary = getExpenseSummary(expense);
	const thisMonthLabel = formatDate(summary.now, "MMMM yyyy");
	const previousMonthLabel = formatDate(summary.previousMonthDate, "MMMM yyyy");
	const diffPct = getDiffPctValue(
		summary.totalThisMonth,
		summary.totalPreviousMonth,
	);
	const formattedDiffPct = getFormattedPct(diffPct);
	const monthProgressPct = summary.daysInMonth
		? (summary.daysElapsed / summary.daysInMonth) * 100
		: 0;

	return (
		<section>
			<h2 className="mb-3 text-md font-medium text-muted-foreground">
				{m.content_section_total()}
			</h2>
			<Collapsible
				open={open}
				onOpenChange={setOpen}
				className="overflow-hidden rounded-2xl border border-border/50 shadow-sm"
			>
				<div className="border-b border-border/50 px-4 py-4">
					<div className="flex items-start justify-between gap-3">
						<div className="min-w-0">
							<p className="text-muted-foreground truncate text-xs font-medium uppercase tracking-wider">
								{m.content_total_this_month()} · {thisMonthLabel}
							</p>
							<p className="mt-1 truncate text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl">
								{formatCurrency(summary.totalThisMonth)}
							</p>
						</div>
						<CollapsibleTrigger className="text-muted-foreground group flex shrink-0 items-center gap-1.5 rounded-md text-xs">
							{m.content_view_details()}
							<ChevronDownIcon className="size-4 transition-all ease-out group-data-[panel-open]:rotate-180" />
						</CollapsibleTrigger>
					</div>
					<div className="mt-3 space-y-1.5">
						<div className="bg-muted h-2 overflow-hidden rounded-full">
							<div
								className="h-full rounded-full bg-emerald-500"
								style={{ width: `${Math.min(monthProgressPct, 100)}%` }}
							/>
						</div>
						<p className="text-muted-foreground truncate text-xs font-medium uppercase tracking-wider">
							{m.content_total_day_progress({
								day: String(summary.daysElapsed),
								total: String(summary.daysInMonth),
							})}
						</p>
					</div>
				</div>

				<CollapsibleContent className="h-[var(--collapsible-panel-height)] overflow-hidden transition-all duration-150 ease-out data-[ending-style]:h-0 data-[starting-style]:h-0 [&[hidden]:not([hidden='until-found'])]:hidden">
					<div className="grid grid-cols-1 divide-y divide-border/50 sm:grid-cols-2 sm:divide-y-0 sm:divide-x">
						<MetricCard
							label={m.content_total_projection_label()}
							value={formatCurrency(summary.projectionEndOfMonth)}
						/>
						<MetricCard
							label={m.content_total_vs_previous_label({
								month: previousMonthLabel,
							})}
							value={
								diffPct > 0
									? `+${formattedDiffPct}%`
									: diffPct < 0
										? `-${formattedDiffPct}%`
										: "0%"
							}
							valueClassName={
								diffPct > 0
									? "text-destructive"
									: diffPct < 0
										? "text-emerald-600 dark:text-emerald-400"
										: "text-foreground"
							}
						/>
						<MetricCard
							label={m.content_total_daily_avg_label()}
							value={formatCurrency(summary.dailyAverage)}
						/>
						<MetricCard
							label={m.content_total_historical_avg_label()}
							value={formatCurrency(summary.historicalMonthlyAverage)}
						/>
					</div>

					<div className="grid grid-cols-1 divide-y divide-border/50 border-t border-border/50 md:grid-cols-2 md:divide-x md:divide-y-0">
						<div className="flex flex-col px-4 py-4">
							<p className="text-muted-foreground truncate text-xs font-medium uppercase tracking-wider">
								{m.content_total_top_categories_label()}
							</p>
							<div className="mt-3 space-y-2">
								{summary.topCategories.length > 0 ? (
									summary.topCategories.map((item) => (
										<div key={item.category} className="space-y-1">
											<div className="flex items-center justify-between gap-3">
												<p className="truncate text-sm font-medium">
													{item.category}
												</p>
												<p className="text-muted-foreground shrink-0 text-xs tabular-nums">
													{formatCurrency(item.total)} (
													{getFormattedPct(item.share)}%)
												</p>
											</div>
											<div className="bg-muted h-1.5 overflow-hidden rounded-full">
												<div
													className="h-full rounded-full bg-sky-500"
													style={{ width: `${Math.max(6, item.share)}%` }}
												/>
											</div>
										</div>
									))
								) : (
									<p className="text-muted-foreground text-sm">
										{m.content_total_no_expenses_month()}
									</p>
								)}
							</div>
						</div>

						<div className="flex flex-col px-4 py-4">
							<p className="text-muted-foreground truncate text-xs font-medium uppercase tracking-wider">
								{m.content_total_top_expenses_label()}
							</p>
							<div className="mt-3 space-y-2">
								{summary.topExpenses.length > 0 ? (
									summary.topExpenses.map((item) => (
										<div key={item.id} className="space-y-1">
											<div className="flex items-center justify-between gap-3">
												<p className="truncate text-sm font-medium">
													{item.description}
												</p>
												<p className="text-muted-foreground shrink-0 text-xs tabular-nums">
													{formatCurrency(item.amount)} (
													{getFormattedPct(item.share)}%)
												</p>
											</div>
											<div className="bg-muted h-1.5 overflow-hidden rounded-full">
												<div
													className="h-full rounded-full bg-amber-500"
													style={{ width: `${Math.max(6, item.share)}%` }}
												/>
											</div>
										</div>
									))
								) : (
									<p className="text-muted-foreground text-sm">
										{m.content_total_no_expenses_month()}
									</p>
								)}
							</div>
						</div>
					</div>
				</CollapsibleContent>
			</Collapsible>
		</section>
	);
}

function MetricCard({
	label,
	value,
	valueClassName,
}: {
	label: string;
	value: string;
	valueClassName?: string;
}) {
	return (
		<div className="min-w-0 overflow-hidden px-4 py-4">
			<p className="text-muted-foreground truncate text-xs font-medium uppercase tracking-wider">
				{label}
			</p>
			<p
				className={`mt-1 truncate text-lg font-semibold tabular-nums tracking-tight sm:text-2xl ${valueClassName ?? ""}`}
			>
				{value}
			</p>
		</div>
	);
}

function getMonthKey(date: Date) {
	const y = date.getFullYear();
	const m = date.getMonth() + 1;
	return `${y}-${String(m).padStart(2, "0")}`;
}

function getPreviousMonthDate(date: Date) {
	return new Date(date.getFullYear(), date.getMonth() - 1, 1);
}

function getExpenseSummary(expense: ExpenseItem[]) {
	const now = new Date();
	const thisMonthKey = getMonthKey(now);
	const previousMonthDate = getPreviousMonthDate(now);
	const previousMonthKey = getMonthKey(previousMonthDate);

	let totalHistorical = 0;
	let totalThisMonth = 0;
	let totalPreviousMonth = 0;
	const totalByMonth = new Map<string, number>();
	const categoriesThisMonth = new Map<string, number>();
	const topExpensesThisMonth: Array<{
		id: string;
		description: string;
		category: string;
		amount: number;
		share: number;
	}> = [];

	for (const e of expense) {
		totalHistorical += e.amount;
		const key = e.expense_date ? e.expense_date.slice(0, 7) : null;

		if (key === thisMonthKey) totalThisMonth += e.amount;
		if (key === previousMonthKey) totalPreviousMonth += e.amount;
		if (key) totalByMonth.set(key, (totalByMonth.get(key) ?? 0) + e.amount);
		if (key === thisMonthKey) {
			const category = getCategoryLabel(e.category?.trim() || "other");
			categoriesThisMonth.set(
				category,
				(categoriesThisMonth.get(category) ?? 0) + e.amount,
			);
			topExpensesThisMonth.push({
				id: e.id,
				description: e.description?.trim() || m.expense_default_description(),
				category,
				amount: e.amount,
				share: 0,
			});
		}
	}

	const monthCount = Math.max(totalByMonth.size, 1);
	const historicalMonthlyAverage = totalHistorical / monthCount;
	const daysElapsed = now.getDate();
	const daysInMonth = new Date(
		now.getFullYear(),
		now.getMonth() + 1,
		0,
	).getDate();
	const dailyAverage = daysElapsed ? totalThisMonth / daysElapsed : 0;
	const projectionEndOfMonth = dailyAverage * daysInMonth;
	const topCategories = Array.from(categoriesThisMonth.entries())
		.map(([category, total]) => ({
			category,
			total,
			share: totalThisMonth > 0 ? (total / totalThisMonth) * 100 : 0,
		}))
		.sort((a, b) => b.total - a.total)
		.slice(0, 3);
	const topExpenses = topExpensesThisMonth
		.sort((a, b) => b.amount - a.amount)
		.slice(0, 3)
		.map((item) => ({
			...item,
			share: totalThisMonth > 0 ? (item.amount / totalThisMonth) * 100 : 0,
		}));

	return {
		now,
		previousMonthDate,
		totalHistorical,
		totalThisMonth,
		totalPreviousMonth,
		historicalMonthlyAverage,
		dailyAverage,
		projectionEndOfMonth,
		topCategories,
		topExpenses,
		daysElapsed,
		daysInMonth,
	};
}

function getDiffPctValue(totalThisMonth: number, totalPreviousMonth: number) {
	return totalPreviousMonth > 0
		? ((totalThisMonth - totalPreviousMonth) / totalPreviousMonth) * 100
		: totalThisMonth > 0
			? 100
			: 0;
}

function getFormattedPct(diffPctValue: number) {
	return Math.abs(diffPctValue).toLocaleString(getLocale(), {
		minimumFractionDigits: 0,
		maximumFractionDigits: 1,
	});
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

function getCategoryLabel(rawCategory: string) {
	const category = rawCategory.trim();
	if (categoryLabels[category]) return categoryLabels[category];
	if (category.startsWith("category_")) {
		const normalized = category.replace("category_", "");
		if (categoryLabels[normalized]) return categoryLabels[normalized];
		return normalized.replaceAll("_", " ");
	}
	return category;
}
