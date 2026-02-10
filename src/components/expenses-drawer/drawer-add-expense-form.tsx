import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { m } from "@/paraglide/messages";
import type { ExpensesDrawerMember } from "./types";

type DrawerAddExpenseFormProps = {
  members: ExpensesDrawerMember[];
  memberId: string;
  onMemberIdChange: (id: string) => void;
  onSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
};

export function DrawerAddExpenseForm({
  members,
  memberId,
  onMemberIdChange,
  onSubmit,
}: DrawerAddExpenseFormProps) {
  return (
    <form className="flex flex-col gap-4 p-4" onSubmit={onSubmit}>
      <input type="hidden" name="memberId" value={memberId} />
      <FieldGroup>
        <Field>
          <FieldLabel>{m.drawer_field_person()}</FieldLabel>
          <Select
            required
            value={memberId || undefined}
            onValueChange={(v) => onMemberIdChange(v ?? "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={m.drawer_field_who_paid_placeholder()}>
                {memberId
                  ? members.find((m) => m.id === memberId)?.name
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
          <Input name="category" placeholder={m.drawer_field_category_placeholder()} />
        </Field>

        <Field>
          <FieldLabel>{m.drawer_field_description()}</FieldLabel>
          <Input name="description" placeholder={m.drawer_field_description_placeholder()} />
        </Field>
      </FieldGroup>

      <Button type="submit">{m.drawer_submit_add_expense()}</Button>
    </form>
  );
}
