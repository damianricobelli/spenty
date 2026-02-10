import { useQuery } from "@tanstack/react-query";
import { useLoaderData, useRouter } from "@tanstack/react-router";
import { CalendarIcon, Loader2Icon } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getExpenseWithSplits } from "@/api/expenses";
import { AddExpenseEntrySchema, UpdateExpenseEntrySchema } from "@/api/schema";
import { Calendar } from "@/components/ui/calendar";
import {
	Combobox,
	ComboboxChip,
	ComboboxChips,
	ComboboxChipsInput,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxItem,
	ComboboxList,
	ComboboxValue,
	useComboboxAnchor,
} from "@/components/ui/combobox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useAddExpenseEntry } from "@/hooks/expenses/use-add-expense-entry";
import { useUpdateExpenseEntry } from "@/hooks/expenses/use-update-expense-entry";
import { useEntity } from "@/hooks/use-entity";
import { getErrorMessage } from "@/lib/get-error-message";
import { m } from "@/paraglide/messages";
import { ButtonWithSpinner } from "../button-with-spinner";

type BaseProps = {
	resetDrawer: () => void;
};

type AddProps = BaseProps & {
	intent: "add";
};

type EditProps = BaseProps & {
	intent: "edit";
	expenseId: string;
};

export type DrawerExpenseFormProps = AddProps | EditProps;

type MemberItem = { value: string; label: string };

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

export function DrawerExpenseForm(props: DrawerExpenseFormProps) {
	const { intent, resetDrawer } = props;
	const router = useRouter();
	const from = useEntity();
	const { group, members } = useLoaderData({ from });

	const isSplits = from === "/splits/$id";

	const addMutation = useAddExpenseEntry();
	const updateMutation = useUpdateExpenseEntry();

	const anchor = useComboboxAnchor();

	const expenseIdForQuery = intent === "edit" ? props.expenseId : "";
	const { data: expense, isLoading } = useQuery({
		queryKey: ["expenseWithSplits", expenseIdForQuery],
		queryFn: () =>
			getExpenseWithSplits({ data: { expenseId: expenseIdForQuery } }),
		enabled: intent === "edit" && !!expenseIdForQuery,
	});

	const [expenseMemberId, setExpenseMemberId] = useState(() =>
		intent === "add" && members.length === 1 ? members[0].id : "",
	);
	const [paidToMemberIds, setPaidToMemberIds] = useState<string[]>([]);
	const [category, setCategory] = useState("");
	const [paymentDate, setPaymentDate] = useState<Date | undefined>(() =>
		intent === "add" ? new Date() : undefined,
	);

	useEffect(() => {
		if (intent !== "edit" || !expense) return;
		setExpenseMemberId(expense.paid_by ?? "");
		setPaidToMemberIds(expense.paidToMemberIds ?? []);
		setCategory(expense.category ?? "");
		setPaymentDate(
			expense.expense_date
				? new Date(`${expense.expense_date}T12:00:00`)
				: new Date(),
		);
	}, [intent, expense]);

	const memberItems: MemberItem[] = useMemo(
		() => members.map((m) => ({ value: m.id, label: m.name })),
		[members],
	);
	const paidToValues: MemberItem[] = useMemo(
		() =>
			paidToMemberIds
				.map((id) => memberItems.find((item) => item.value === id))
				.filter((item): item is MemberItem => item != null),
		[paidToMemberIds, memberItems],
	);

	const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (intent === "edit" && !expense) return;
		if (!expenseMemberId) {
			toast.error(m.drawer_field_person());
			return;
		}

		const formData = new FormData(e.currentTarget);
		const amountRaw = formData.get("amount");
		const amount =
			typeof amountRaw === "string"
				? Number.parseFloat(amountRaw.replace(",", "."))
				: NaN;

		if (Number.isNaN(amount) || amount <= 0) {
			toast.error(m.drawer_field_amount());
			return;
		}

		if (isSplits && paidToMemberIds.length === 0) {
			toast.error(m.drawer_field_paid_to_required());
			return;
		}

		const rawDescription = (formData.get("description") as string)?.trim();
		const description = rawDescription || m.expense_default_description();

		if (intent === "add") {
			const result = AddExpenseEntrySchema.safeParse({
				groupId: group.id,
				memberId: expenseMemberId,
				amount,
				category: category || "other",
				description,
				...(isSplits ? { paidToMemberIds } : {}),
				paymentDate: (paymentDate ?? new Date()).toISOString().slice(0, 10),
			});
			if (!result.success) {
				console.error("Invalid expense:", result.error);
				return;
			}
			addMutation.mutate(result.data, {
				onSuccess: () => {
					resetDrawer();
					router.invalidate();
				},
				onError: (err) => toast.error(getErrorMessage(err)),
			});
			return;
		}

		const result = UpdateExpenseEntrySchema.safeParse({
			groupId: group.id,
			expenseId: props.expenseId,
			memberId: expenseMemberId,
			amount,
			category: category || "other",
			description,
			...(isSplits ? { paidToMemberIds } : {}),
			...(paymentDate
				? { paymentDate: paymentDate.toISOString().slice(0, 10) }
				: {}),
		});
		if (!result.success) {
			console.error("Invalid expense:", result.error);
			return;
		}
		updateMutation.mutate(result.data, {
			onSuccess: () => {
				resetDrawer();
				router.invalidate();
			},
			onError: (err) => toast.error(getErrorMessage(err)),
		});
	};

	if (intent === "edit" && (isLoading || !expense)) {
		return (
			<div className="flex items-center justify-center p-6 text-muted-foreground">
				<Loader2Icon className="size-8 animate-spin" />
			</div>
		);
	}

	const isAdd = intent === "add";

	return (
		<form className="flex flex-col gap-4 p-4" onSubmit={handleSubmit}>
			<input type="hidden" name="memberId" value={expenseMemberId} />
			<FieldGroup>
				<Field>
					<FieldLabel>{m.drawer_field_person()}</FieldLabel>
					<Select
						required
						value={expenseMemberId || undefined}
						onValueChange={(v) => setExpenseMemberId(v ?? "")}
					>
						<SelectTrigger className="w-full">
							<SelectValue>
								{expenseMemberId
									? members.find((m) => m.id === expenseMemberId)?.name
									: null}
							</SelectValue>
						</SelectTrigger>
						<SelectContent alignItemWithTrigger={false}>
							{members.map((member) => (
								<SelectItem key={member.id} value={member.id}>
									{member.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</Field>

				{isSplits && (
					<Field>
						<FieldLabel>{m.drawer_field_paid_to()} *</FieldLabel>
						<Combobox<MemberItem, true>
							multiple
							autoHighlight
							value={paidToValues}
							onValueChange={(arr: MemberItem[] | null) =>
								setPaidToMemberIds(arr?.map((i) => i.value) ?? [])
							}
							items={memberItems}
							itemToStringValue={(item) => item.label}
						>
							<ComboboxChips ref={anchor} className="w-full">
								<ComboboxValue>
									{(values) => (
										<React.Fragment>
											{values.map((value: MemberItem) => (
												<ComboboxChip key={value.value}>
													{value.label}
												</ComboboxChip>
											))}
											<ComboboxChipsInput />
										</React.Fragment>
									)}
								</ComboboxValue>
							</ComboboxChips>
							<ComboboxContent anchor={anchor}>
								<ComboboxEmpty>{m.combobox_no_results()}</ComboboxEmpty>
								<ComboboxList>
									{(item: MemberItem) => (
										<ComboboxItem key={item.value} value={item}>
											{item.label}
										</ComboboxItem>
									)}
								</ComboboxList>
							</ComboboxContent>
						</Combobox>
					</Field>
				)}

				<Field>
					<FieldLabel>{m.drawer_field_amount()}</FieldLabel>
					<Input
						name="amount"
						type="text"
						inputMode="decimal"
						autoComplete="off"
						placeholder={m.drawer_field_amount_placeholder()}
						required
						defaultValue={isAdd ? undefined : expense?.amount}
					/>
				</Field>

				<Field>
					<FieldLabel>{m.drawer_field_category()}</FieldLabel>
					<Select
						value={category || undefined}
						onValueChange={(v) => setCategory(v ?? "")}
					>
						<SelectTrigger className="w-full">
							<SelectValue>
								{category
									? categoryLabels[category]
									: m.drawer_field_category_placeholder()}
							</SelectValue>
						</SelectTrigger>
						<SelectContent alignItemWithTrigger={false}>
							{Object.entries(categoryLabels).map(([value, label]) => (
								<SelectItem key={value} value={value}>
									{label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</Field>

				<Field>
					<FieldLabel>{m.drawer_field_description()}</FieldLabel>
					<Input
						name="description"
						placeholder={m.drawer_field_description_placeholder()}
						defaultValue={isAdd ? undefined : expense?.description ?? ""}
					/>
				</Field>

				<Field>
					<FieldLabel>{m.drawer_field_payment_date()}</FieldLabel>
					<Popover>
						<PopoverTrigger
							type="button"
							className="border-input bg-input/30 flex h-10 w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
						>
							<span
								className={
									paymentDate ? "text-foreground" : "text-muted-foreground"
								}
							>
								{paymentDate
									? paymentDate.toLocaleDateString(undefined, {
											day: "numeric",
											month: "short",
											year: "numeric",
										})
									: m.drawer_field_payment_date_placeholder()}
							</span>
							<CalendarIcon className="size-4 shrink-0 opacity-50" />
						</PopoverTrigger>
						<PopoverContent align="start" className="w-(--anchor-width) p-0">
							<Calendar
								mode="single"
								required={isAdd}
								fixedWeeks={!isAdd}
								endMonth={new Date()}
								selected={paymentDate}
								disabled={{
									after: new Date(),
								}}
								onSelect={setPaymentDate}
							/>
						</PopoverContent>
					</Popover>
				</Field>
			</FieldGroup>

			<ButtonWithSpinner
				text={
					isAdd
						? m.drawer_submit_add_expense()
						: m.drawer_submit_edit_expense()
				}
				isPending={isAdd ? addMutation.isPending : updateMutation.isPending}
			/>
		</form>
	);
}
