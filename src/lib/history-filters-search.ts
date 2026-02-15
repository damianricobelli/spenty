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
		const trimmed = value.trim();
		if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
			try {
				const parsed = JSON.parse(trimmed);
				if (Array.isArray(parsed)) {
					return parsed
						.map((item) => String(item).trim())
						.filter(Boolean);
				}
			} catch {
				// Fallback to plain CSV parsing below.
			}
		}
		return value
			.split(",")
			.map((item) => item.trim())
			.filter(Boolean);
	}
	return [];
}

export const historyFiltersSearchSchema = z.object({
	months: z
		.unknown()
		.optional()
		.transform((value) => {
			const items = normalizeSearchArray(value).filter((item) =>
				MONTH_KEY_REGEX.test(item),
			);
			return items.length ? items : undefined;
		}),
	categories: z
		.unknown()
		.optional()
		.transform((value) => {
			const items = normalizeSearchArray(value).filter(
				(item): item is HistoryCategory =>
					HISTORY_CATEGORY_VALUES.includes(item as HistoryCategory),
			);
			return items.length ? items : undefined;
		}),
	paidBy: z
		.unknown()
		.optional()
		.transform((value) => {
			const items = normalizeSearchArray(value);
			return items.length ? items : undefined;
		}),
	search: z
		.string()
		.optional()
		.transform((value) => {
			const normalized = value?.trim();
			return normalized ? normalized : undefined;
		}),
});

export type HistoryFiltersSearch = z.infer<typeof historyFiltersSearchSchema>;
