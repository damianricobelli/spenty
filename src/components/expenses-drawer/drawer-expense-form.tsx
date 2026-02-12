import { useLoaderData, useRouter } from "@tanstack/react-router";
import { CalendarIcon, Loader2Icon, Trash2Icon } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AddExpenseEntrySchema, UpdateExpenseEntrySchema } from "@/api/schema";
import { Button } from "@/components/ui/button";
import {
	Combobox,
	ComboboxChip,
	ComboboxChips,
	ComboboxChipsInput,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
	ComboboxTrigger,
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
import { useCreateGroupCategory } from "@/hooks/categories/use-create-group-category";
import { useDeleteGroupCategory } from "@/hooks/categories/use-delete-group-category";
import { useGroupCategories } from "@/hooks/categories/use-group-categories";
import { useAddExpenseEntry } from "@/hooks/expenses/use-add-expense-entry";
import { useExpenseWithSplits } from "@/hooks/expenses/use-expense-with-splits";
import { useUpdateExpenseEntry } from "@/hooks/expenses/use-update-expense-entry";
import { useEntity } from "@/hooks/use-entity";
import { formatDate } from "@/lib/format-date";
import { getErrorMessage } from "@/lib/get-error-message";
import { m } from "@/paraglide/messages";
import { ButtonWithSpinner } from "../button-with-spinner";
import { SimpleDatePicker } from "../ui/calendar";

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

type CategoryItem = { value: string; label: string; id?: string };

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
	const createCategoryMutation = useCreateGroupCategory();
	const deleteCategoryMutation = useDeleteGroupCategory();
	const { data: customCategories = [] } = useGroupCategories(group.id);

	const anchor = useComboboxAnchor();

	const [categoryOpen, setCategoryOpen] = useState(false);
	const [categoryInputValue, setCategoryInputValue] = useState("");

	const expenseIdForQuery = intent === "edit" ? props.expenseId : "";
	const { data: expense, isLoading } = useExpenseWithSplits(
		expenseIdForQuery,
		intent === "edit",
	);

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

	const baseCategoryItems: CategoryItem[] = useMemo(
		() =>
			Object.entries(categoryLabels).map(([value, label]) => ({
				value,
				label,
			})),
		[],
	);
	const customCategoryItems: CategoryItem[] = useMemo(
		() =>
			customCategories.map((c) => ({
				value: c.name,
				label: c.name,
				id: c.id,
			})),
		[customCategories],
	);
	const categoryItems: CategoryItem[] = useMemo(() => {
		const list = [...baseCategoryItems, ...customCategoryItems];
		if (intent === "edit" && expense?.category) {
			const exists = list.some((i) => i.value === expense.category);
			if (!exists)
				list.push({
					value: expense.category,
					label: expense.category,
				});
		}
		return list;
	}, [baseCategoryItems, customCategoryItems, intent, expense?.category]);

	const filteredCategoryItems = useMemo(() => {
		const q = categoryInputValue.trim().toLowerCase();
		const matched = categoryItems.filter((i) =>
			i.label.toLowerCase().includes(q),
		);
		if (matched.length === 0 && q.length > 0) {
			return [
				{
					value: q,
					label: m.combobox_create_category({ query: q }),
				} as CategoryItem,
			];
		}
		return matched;
	}, [categoryItems, categoryInputValue]);

	const selectedCategoryItem: CategoryItem | null = useMemo(
		() => categoryItems.find((i) => i.value === category) ?? null,
		[categoryItems, category],
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
						value={expenseMemberId}
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
						<FieldLabel>{m.drawer_field_paid_to()}</FieldLabel>
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
					<Combobox<CategoryItem>
						value={selectedCategoryItem}
						onValueChange={(item: CategoryItem | null) => {
							if (!item) {
								setCategory("");
								return;
							}
							setCategory(item.value);
							const isCreateItem =
								!item.id &&
								!Object.hasOwn(categoryLabels, item.value) &&
								!customCategoryItems.some((c) => c.value === item.value);
							if (isCreateItem && item.value.trim()) {
								createCategoryMutation.mutate(
									{ groupId: group.id, name: item.value.trim() },
									{
										onSuccess: () => setCategoryOpen(false),
										onError: (err) =>
											toast.error(getErrorMessage(err)),
									},
								);
							} else {
								setCategoryOpen(false);
							}
						}}
						items={categoryItems}
						filteredItems={filteredCategoryItems}
						inputValue={categoryInputValue}
						onInputValueChange={(v) => setCategoryInputValue(v)}
						open={categoryOpen}
						onOpenChange={(open) => {
							setCategoryOpen(open);
							if (!open) setCategoryInputValue("");
						}}
						itemToStringValue={(item) => item.label}
						isItemEqualToValue={(a, b) => a?.value === b?.value}
					>
						<ComboboxTrigger
							render={
								<Button
									type="button"
									variant="outline"
									className="border-input bg-input/30 data-placeholder:text-muted-foreground h-9 w-full justify-between rounded-4xl border px-3 py-2 text-base font-normal"
								>
									{category
										? categoryLabels[category] ?? category
										: m.drawer_field_category_placeholder()}
								</Button>
							}
						/>
						<ComboboxContent>
							<ComboboxInput
								showTrigger={false}
								placeholder={m.combobox_search_category_placeholder()}
							/>
							<ComboboxEmpty>{m.combobox_no_results()}</ComboboxEmpty>
							<ComboboxList>
								{(item: CategoryItem) => (
									<ComboboxItem key={item.id ?? item.value} value={item}>
										<span className="flex flex-1 items-center gap-2">
											{item.label}
											{item.id != null && (
												<Button
													type="button"
													variant="destructive"
													size="icon-xs"
													className="ml-auto"
													aria-label={m.category_delete_aria_label()}
													onClick={(e) => {
														e.preventDefault();
														e.stopPropagation();
														deleteCategoryMutation.mutate(
															{
																groupId: group.id,
																categoryId: item.id as string,
															},
															{
																onSuccess: () => {
																	if (category === item.value)
																		setCategory("");
																},
																onError: (err) =>
																	toast.error(getErrorMessage(err)),
															},
														);
													}}
												>
													<Trash2Icon className="size-3.5" />
												</Button>
											)}
										</span>
									</ComboboxItem>
								)}
							</ComboboxList>
						</ComboboxContent>
					</Combobox>
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
					<Popover
						modal
					>
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
									? formatDate(paymentDate, "PPP")
									: m.drawer_field_payment_date_placeholder()}
							</span>
							<CalendarIcon className="size-4 shrink-0 opacity-50" />
						</PopoverTrigger>
						<PopoverContent align="start" className="w-(--anchor-width) p-0">
							<SimpleDatePicker
								selected={paymentDate}
								onSelect={setPaymentDate}
								maxDate={new Date()}
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
