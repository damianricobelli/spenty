import { useQuery } from "@tanstack/react-query";
import { useLoaderData, useRouter } from "@tanstack/react-router";
import { Loader2Icon } from "lucide-react";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { getExpenseWithSplits } from "@/api/expenses";
import { UpdateExpenseEntrySchema } from "@/api/schema";
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
import { useUpdateExpenseEntry } from "@/hooks/expenses/use-update-expense-entry";
import { useEntity } from "@/hooks/use-entity";
import { getErrorMessage } from "@/lib/get-error-message";
import { m } from "@/paraglide/messages";
import { ButtonWithSpinner } from "../button-with-spinner";

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

export function DrawerEditExpenseForm({
  expenseId,
  resetDrawer,
}: {
  expenseId: string;
  resetDrawer: () => void;
}) {
  const router = useRouter();
  const from = useEntity();
  const { group, members } = useLoaderData({ from });
  const { data: expense, isLoading } = useQuery({
    queryKey: ["expenseWithSplits", expenseId],
    queryFn: () => getExpenseWithSplits({ data: { expenseId } }),
    enabled: !!expenseId,
  });
  const updateMutation = useUpdateExpenseEntry();
  const anchor = useComboboxAnchor();
  const isSplits = from === "/splits/$id";

  const [expenseMemberId, setExpenseMemberId] = useState(() =>
    expense?.paid_by ?? "",
  );
  const [paidToMemberIds, setPaidToMemberIds] = useState<string[]>(() =>
    expense?.paidToMemberIds ?? [],
  );
  const [category, setCategory] = useState(() => expense?.category ?? "");

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
    if (!expense) return;
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
    const result = UpdateExpenseEntrySchema.safeParse({
      groupId: group.id,
      expenseId,
      memberId: expenseMemberId,
      amount,
      category: category || "other",
      description: rawDescription || m.expense_default_description(),
      ...(isSplits ? { paidToMemberIds } : {}),
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

  if (isLoading || !expense) {
    return (
      <div className="flex items-center justify-center p-6 text-muted-foreground">
        <Loader2Icon className="size-8 animate-spin" />
      </div>
    );
  }

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
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            placeholder={m.drawer_field_amount_placeholder()}
            required
            defaultValue={expense.amount}
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
            defaultValue={expense.description ?? ""}
          />
        </Field>
      </FieldGroup>

      <ButtonWithSpinner
        text={m.drawer_submit_edit_expense()}
        isPending={updateMutation.isPending}
      />
    </form>
  );
}
