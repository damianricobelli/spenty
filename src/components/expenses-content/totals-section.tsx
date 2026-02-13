import { useState } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/format-currency";
import { formatDate } from "@/lib/format-date";
import { m } from "@/paraglide/messages";
import { getLocale } from "@/paraglide/runtime";
import type { ExpenseItem } from "./expenses-content";

export function TotalsSection({ expense }: { expense: ExpenseItem[] }) {
	const { totalAll, totalThisMonth, totalByMonth, sortedMonths } =
		getExpenseTotals(expense);

	const [compareMonthKey, setCompareMonthKey] = useState<string | null>(null);

	const compareMonthTotal = getCompareMonthTotal(totalByMonth, compareMonthKey);

	const compareLabel =
		getCompareMonthLabel(compareMonthKey);

	const diffPctValue =
		getDiffPctValue(totalThisMonth, compareMonthTotal);
        
	const formattedPct = getFormattedPct(diffPctValue);

	return (
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
	);
}

// Helper functions

function getMonthKey(date: Date) {
	const y = date.getFullYear();
	const m = date.getMonth() + 1;
	return `${y}-${String(m).padStart(2, "0")}`;
}

function getExpenseTotals(expense: ExpenseItem[]) {
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
}

function getCompareMonthLabel(compareMonthKey: string | null) {
	return compareMonthKey
		? formatDate(
				new Date(
					Number(compareMonthKey.split("-")[0]),
					Number(compareMonthKey.split("-")[1]) - 1,
					1
				),
				"MMMM yyyy"
			)
		: undefined;
}

function getCompareMonthTotal(totalByMonth: Map<string, number>, compareMonthKey: string | null) {
	return compareMonthKey
		? (totalByMonth.get(compareMonthKey) ?? 0)
		: 0;
}

function getDiffPctValue(totalThisMonth: number, compareMonthTotal: number) {
	return compareMonthTotal > 0
		? ((totalThisMonth - compareMonthTotal) / compareMonthTotal) * 100
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