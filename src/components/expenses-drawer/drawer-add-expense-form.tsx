import { useLoaderData, useRouter } from "@tanstack/react-router";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { AddExpenseEntrySchema } from "@/api/schema";
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useAddExpenseEntry } from "@/hooks/expenses/use-add-expense-entry";
import { useEntity } from "@/hooks/use-entity";
import { getErrorMessage } from "@/lib/get-error-message";
import { m } from "@/paraglide/messages";
import { ButtonWithSpinner } from "../button-with-spinner";

type MemberItem = { value: string; label: string };

export function DrawerAddExpenseForm({
	resetDrawer,
}: {
	resetDrawer: () => void;
}) {
	const router = useRouter();
	const from = useEntity();
	const { group, members } = useLoaderData({
		from,
	});
	const addExpenseMutation = useAddExpenseEntry();

	const anchor = useComboboxAnchor();

	const isSplits = from === "/splits/$id";

	const [expenseMemberId, setExpenseMemberId] = useState("");
	const [paidToMemberIds, setPaidToMemberIds] = useState<string[]>([]);

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

	const handleAddExpense = (e: React.SyntheticEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const amountRaw = formData.get("amount");
		const amount =
			typeof amountRaw === "string"
				? Number.parseFloat(amountRaw.replace(",", "."))
				: NaN;

		if (isSplits && paidToMemberIds.length === 0) {
			toast.error(m.drawer_field_paid_to_required());
			return;
		}
		const result = AddExpenseEntrySchema.safeParse({
			groupId: group.id,
			memberId: formData.get("memberId"),
			amount,
			category: formData.get("category") || undefined,
			description: formData.get("description") || undefined,
			...(isSplits ? { paidToMemberIds } : {}),
		});
		if (!result.success) {
			console.error("Invalid expense:", result.error);
			return;
		}

		addExpenseMutation.mutate(result.data, {
			onSuccess: () => {
				resetDrawer();
				router.invalidate();
			},
			onError: (err) => toast.error(getErrorMessage(err)),
		});
	};

	return (
		<form className="flex flex-col gap-4 p-4" onSubmit={handleAddExpense}>
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
								<ComboboxEmpty>No results</ComboboxEmpty>
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
						type="number"
						inputMode="decimal"
						min={0}
						step="0.01"
						placeholder={m.drawer_field_amount_placeholder()}
						required
					/>
				</Field>

				<Field>
					<FieldLabel>{m.drawer_field_category()}</FieldLabel>
					<Input
						name="category"
						placeholder={m.drawer_field_category_placeholder()}
					/>
				</Field>

				<Field>
					<FieldLabel>{m.drawer_field_description()}</FieldLabel>
					<Input
						name="description"
						placeholder={m.drawer_field_description_placeholder()}
					/>
				</Field>
			</FieldGroup>

			<ButtonWithSpinner
				text={m.drawer_submit_add_expense()}
				isPending={addExpenseMutation.isPending}
			/>
		</form>
	);
}
