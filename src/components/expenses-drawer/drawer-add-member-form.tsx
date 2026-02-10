import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { m } from "@/paraglide/messages";
import { getErrorMessage } from "@/lib/get-error-message";

type DrawerAddMemberFormProps = {
  error: Error | null;
  onSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
};

export function DrawerAddMemberForm({
  error,
  onSubmit,
}: DrawerAddMemberFormProps) {
  return (
    <form className="flex flex-col gap-4 p-4" onSubmit={onSubmit}>
      <Field aria-invalid={!!error}>
        <FieldLabel>{m.drawer_field_name()}</FieldLabel>
        <Input required name="name" aria-invalid={!!error} />
      </Field>
      {error && (
        <FieldError
          errors={[{ message: getErrorMessage(error) }]}
        />
      )}
      <Button type="submit">{m.drawer_submit_add_member()}</Button>
    </form>
  );
}
