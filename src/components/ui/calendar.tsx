import {
	addMonths,
	eachDayOfInterval,
	endOfMonth,
	endOfWeek,
	isAfter,
	isSameDay,
	isSameMonth,
	startOfMonth,
	startOfWeek,
	subMonths,
} from "date-fns";
import {  ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import  { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format-date";

type BaseProps = {
	resetToolbar: () => void;
};

type AddProps = BaseProps & {
	intent: "add";
};

type EditProps = BaseProps & {
	intent: "edit";
	expenseId: string;
};

export type ToolbarExpenseFormProps = AddProps | EditProps;

export function SimpleDatePicker({
	selected,
	onSelect,
	maxDate = new Date(),
}: {
	selected: Date | undefined;
	onSelect: (date: Date) => void;
	maxDate?: Date;
}) {
	const [viewMonth, setViewMonth] = useState(() =>
		selected ? startOfMonth(selected) : startOfMonth(maxDate),
	);
	useEffect(() => {
		setViewMonth(startOfMonth(selected ?? maxDate));
	}, [selected, maxDate]);

	const monthStart = startOfMonth(viewMonth);
	const monthEnd = endOfMonth(viewMonth);
	const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
	const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
	const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

	const canGoNext = addMonths(viewMonth, 1) <= maxDate;
	const weekdayLabels = [1, 2, 3, 4, 5, 6, 7].map((d) =>
		formatDate(new Date(2024, 0, d), "EEE"),
	);

	return (
		<div className="p-3">
			<div className="mb-3 flex items-center justify-between">
				<Button
					variant="ghost"
					size="icon"
					onClick={() => setViewMonth((m) => subMonths(m, 1))}
					aria-label="Mes anterior"
				>
					<ChevronLeftIcon />
				</Button>
				<span className="text-lg font-medium">
					{formatDate(viewMonth, "MMMM yyyy")}
				</span>
				<Button
					variant="ghost"
					size="icon"
					disabled={!canGoNext}
					onClick={() => setViewMonth((m) => addMonths(m, 1))}
					aria-label="Mes siguiente"
				>
					<ChevronRightIcon />
				</Button>
			</div>
			<div className="grid grid-cols-7 gap-0.5 text-center text-sm">
				{weekdayLabels.map((d) => (
					<div key={d} className="py-1 text-muted-foreground">
						{d}
					</div>
				))}
				{days.map((day) => {
					const disabled = isAfter(day, maxDate);
					const isSelected = selected && isSameDay(day, selected);
					const inMonth = isSameMonth(day, viewMonth);
					return (
						<button
							key={day.getTime()}
							type="button"
							disabled={disabled}
							onClick={() => !disabled && onSelect(day)}
							className={cn(
								"rounded-full size-10 flex items-center justify-center py-2 text-sm transition-colors",
								!inMonth && "text-muted-foreground/60",
								disabled && "cursor-not-allowed opacity-50",
								!disabled && "hover:bg-muted",
								isSelected && "bg-primary text-primary-foreground hover:bg-primary/90",
							)}
						>
							{formatDate(day, "d")}
						</button>
					);
				})}
			</div>
		</div>
	);
}