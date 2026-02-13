import { z } from "zod";

const MONTH_KEY_REGEX = /^\d{4}-\d{2}$/;

export const HISTORY_CATEGORY_VALUES = [
	"food",
	"transport",
	"housing",
	"health",
	"entertainment",
	"shopping",
	"subscriptions",
	"other",
] as const;

export type HistoryCategory = (typeof HISTORY_CATEGORY_VALUES)[number];

function normalizeSearchArray(value: unknown): string[] {
	if (Array.isArray(value)) {
		return value
			.flatMap((item) => String(item).split(","))
			.map((item) => item.trim())
			.filter(Boolean);
	}
	if (typeof value === "string") {
		return value
			.split(",")
			.map((item) => item.trim())
			.filter(Boolean);
	}
	return [];
}

export const historyFiltersSearchSchema = z.object({
	historyMonths: z
		.unknown()
		.optional()
		.transform((value) =>
			normalizeSearchArray(value).filter((item) => MONTH_KEY_REGEX.test(item)),
		),
	historyCategories: z
		.unknown()
		.optional()
		.transform((value) =>
			normalizeSearchArray(value).filter((item): item is HistoryCategory =>
				HISTORY_CATEGORY_VALUES.includes(item as HistoryCategory),
			),
		),
	historyPaidBy: z
		.unknown()
		.optional()
		.transform((value) => normalizeSearchArray(value)),
});

export type HistoryFiltersSearch = z.infer<typeof historyFiltersSearchSchema>;
