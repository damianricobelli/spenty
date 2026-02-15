import { Workbook } from "exceljs";
import { formatDate } from "@/lib/format-date";
import { m } from "@/paraglide/messages";

type ExportExpenseItem = {
	id: string;
	amount: number;
	category: string;
	description: string;
	paid_by: string;
	created_at: string | null;
	expense_date: string | null;
	paid_to_member_ids?: string[];
};

type ExportMember = {
	id: string;
	name: string;
};

type ExportExpensesToExcelParams = {
	groupName: string;
	groupCode: string;
	expenses: ExportExpenseItem[];
	members: ExportMember[];
};

export async function exportExpensesToExcel({
	groupName,
	groupCode,
	expenses,
	members,
}: ExportExpensesToExcelParams) {
	const workbook = new Workbook();
	workbook.creator = "Spenty";
	workbook.created = new Date();

	const sheet = workbook.addWorksheet("Expenses");
	const summarySheet = workbook.addWorksheet("Monthly Summary");
	const memberById = new Map(members.map((member) => [member.id, member.name]));
	const sortedExpenses = [...expenses].sort((a, b) => {
		const dateA = a.expense_date ?? a.created_at ?? "";
		const dateB = b.expense_date ?? b.created_at ?? "";
		if (dateA !== dateB) return dateB.localeCompare(dateA);
		return (b.created_at ?? "").localeCompare(a.created_at ?? "");
	});

	const totalAmount = sortedExpenses.reduce(
		(sum, expense) =>
			sum + (Number.isFinite(expense.amount) ? expense.amount : 0),
		0,
	);

	sheet.mergeCells("A1:G1");
	const titleCell = sheet.getCell("A1");
	titleCell.value = `Spenty · ${groupName}`;
	titleCell.font = { size: 18, bold: true, color: { argb: "FFFFFFFF" } };
	titleCell.fill = {
		type: "pattern",
		pattern: "solid",
		fgColor: { argb: "FF0F766E" },
	};
	titleCell.alignment = { vertical: "middle", horizontal: "left" };
	sheet.getRow(1).height = 30;

	sheet.mergeCells("A2:G2");
	sheet.getCell("A2").value =
		`Code: ${groupCode} · Exported: ${formatDate(new Date(), "PPP p")}`;
	sheet.getCell("A2").font = { color: { argb: "FF475569" } };
	sheet.getRow(2).height = 20;

	sheet.getCell("A4").value = "Transactions";
	sheet.getCell("A4").font = {
		bold: true,
		size: 12,
		color: { argb: "FF0F172A" },
	};
	sheet.getCell("E4").value = "Count";
	sheet.getCell("F4").value = sortedExpenses.length;
	sheet.getCell("E5").value = "Total";
	sheet.getCell("F5").value = totalAmount;
	sheet.getCell("F5").numFmt = "$#,##0.00";
	sheet.getCell("E4").font = { bold: true };
	sheet.getCell("E5").font = { bold: true };
	sheet.getCell("F4").font = { bold: true };
	sheet.getCell("F5").font = { bold: true };

	const tableHeaderRow = 7;
	sheet.columns = [
		{ key: "date", width: 14 },
		{ key: "category", width: 18 },
		{ key: "description", width: 36 },
		{ key: "paidBy", width: 20 },
		{ key: "paidTo", width: 28 },
		{ key: "amount", width: 14 },
		{ key: "month", width: 16 },
	];

	sheet.getRow(tableHeaderRow).values = [
		"Date",
		"Category",
		"Description",
		"Paid by",
		"Paid to",
		"Amount",
		"Month",
	];

	const headerRow = sheet.getRow(tableHeaderRow);
	headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
	headerRow.fill = {
		type: "pattern",
		pattern: "solid",
		fgColor: { argb: "FF1E293B" },
	};
	headerRow.alignment = { vertical: "middle", horizontal: "left" };
	headerRow.height = 22;

	for (const [index, expense] of sortedExpenses.entries()) {
		const transactionDate = getExpenseDate(expense);
		const paidTo = (expense.paid_to_member_ids ?? [])
			.map((id) => memberById.get(id) ?? id)
			.join(", ");
		const dataRow = tableHeaderRow + 1 + index;
		sheet.getRow(dataRow).values = [
			transactionDate ? new Date(`${transactionDate}T12:00:00`) : "",
			getCategoryLabel(expense.category),
			expense.description || "—",
			memberById.get(expense.paid_by) ?? expense.paid_by,
			paidTo || "—",
			expense.amount,
			transactionDate
				? formatDate(new Date(`${transactionDate}T12:00:00`), "MMMM yyyy")
				: "—",
		];

		sheet.getCell(`A${dataRow}`).numFmt = "yyyy-mm-dd";
		sheet.getCell(`F${dataRow}`).numFmt = "$#,##0.00";
		sheet.getRow(dataRow).height = 20;
	}

	const tableEndRow = tableHeaderRow + Math.max(sortedExpenses.length, 1);
	sheet.autoFilter = {
		from: { row: tableHeaderRow, column: 1 },
		to: { row: tableEndRow, column: 7 },
	};

	for (let row = tableHeaderRow + 1; row <= tableEndRow; row++) {
		for (let col = 1; col <= 7; col++) {
			const cell = sheet.getCell(row, col);
			cell.border = {
				top: { style: "thin", color: { argb: "FFE2E8F0" } },
				left: { style: "thin", color: { argb: "FFE2E8F0" } },
				bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
				right: { style: "thin", color: { argb: "FFE2E8F0" } },
			};
		}
		if (row % 2 === 0) {
			sheet.getRow(row).fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: "FFF8FAFC" },
			};
		}
	}

	sheet.views = [{ state: "frozen", ySplit: tableHeaderRow }];

	summarySheet.columns = [
		{ key: "month", width: 18 },
		{ key: "transactions", width: 16 },
		{ key: "total", width: 16 },
	];
	summarySheet.mergeCells("A1:C1");
	summarySheet.getCell("A1").value = "Monthly summary";
	summarySheet.getCell("A1").font = {
		bold: true,
		size: 15,
		color: { argb: "FF1E293B" },
	};
	summarySheet.getRow(3).values = ["Month", "Transactions", "Total"];
	const summaryHeader = summarySheet.getRow(3);
	summaryHeader.font = { bold: true, color: { argb: "FFFFFFFF" } };
	summaryHeader.fill = {
		type: "pattern",
		pattern: "solid",
		fgColor: { argb: "FF334155" },
	};
	summaryHeader.height = 22;

	const summaryByMonth = new Map<string, { count: number; total: number }>();
	for (const expense of sortedExpenses) {
		const key = getMonthKeyFromExpense(expense) ?? "Unknown";
		const current = summaryByMonth.get(key) ?? { count: 0, total: 0 };
		current.count += 1;
		current.total += expense.amount;
		summaryByMonth.set(key, current);
	}

	const orderedMonths = Array.from(summaryByMonth.keys()).sort().reverse();
	for (const [index, monthKey] of orderedMonths.entries()) {
		const row = 4 + index;
		const summary = summaryByMonth.get(monthKey);
		if (!summary) continue;
		summarySheet.getRow(row).values = [monthKey, summary.count, summary.total];
		summarySheet.getCell(`C${row}`).numFmt = "$#,##0.00";
	}

	const summaryEndRow = 3 + Math.max(orderedMonths.length, 1);
	summarySheet.autoFilter = {
		from: { row: 3, column: 1 },
		to: { row: summaryEndRow, column: 3 },
	};
	summarySheet.views = [{ state: "frozen", ySplit: 3 }];

	const fileName = `spenty-${sanitizeFileName(groupName)}-${groupCode}-expenses.xlsx`;
	const buffer = await workbook.xlsx.writeBuffer();
	const blob = new Blob([buffer], {
		type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	});
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = fileName;
	anchor.click();
	URL.revokeObjectURL(url);
}

function sanitizeFileName(value: string) {
	return value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-zA-Z0-9-_]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.toLowerCase();
}

function getExpenseDate(expense: ExportExpenseItem) {
	return expense.expense_date ?? expense.created_at?.slice(0, 10) ?? null;
}

function getMonthKeyFromExpense(expense: ExportExpenseItem) {
	const date = getExpenseDate(expense);
	if (!date) return null;
	const [year, month] = date.split("-");
	if (!year || !month) return null;
	return `${year}-${month}`;
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

function getCategoryLabel(category: string) {
	return categoryLabels[category] ?? category;
}
