import { useLoaderData, useRouter } from "@tanstack/react-router";
import type React from "react";
import { useRef } from "react";
import { toast } from "sonner";
import { AddMemberSchema, UpdateMemberSchema } from "@/api/schema";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAddMember } from "@/hooks/members/use-add-member";
import { useDeleteMember } from "@/hooks/members/use-delete-member";
import { useUpdateMember } from "@/hooks/members/use-update-member";
import { useEntity } from "@/hooks/use-entity";
import { getAvatarColorClasses } from "@/lib/avatar-colors";
import { cn } from "@/lib/cn";
import { getErrorMessage } from "@/lib/get-error-message";
import { m } from "@/paraglide/messages";
import { ButtonWithSpinner } from "../button-with-spinner";
import { ConfirmDeleteButton } from "../confirm-delete-button";

type BaseProps = {
  resetToolbar: () => void;
};

type AddProps = BaseProps & {
  intent: "add";
};

type EditProps = BaseProps & {
  intent: "edit";
  memberId: string;
};

export type ToolbarMemberFormProps = AddProps | EditProps;

export function ToolbarMemberForm(props: ToolbarMemberFormProps) {
  const { intent, resetToolbar } = props;
  const router = useRouter();
  const from = useEntity();
  const { group, members } = useLoaderData({ from });

  const addMutation = useAddMember();
  const updateMutation = useUpdateMember();
  const deleteMutation = useDeleteMember(group.id, { onSuccess: resetToolbar });

  const member =
    intent === "edit"
      ? members.find((m) => m.id === (props as EditProps).memberId)
      : null;

  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const rawName = formData.get("name");

    const name =
      typeof rawName === "string"
        ? rawName.trim().charAt(0).toUpperCase() + rawName.trim().slice(1)
        : "";

    if (intent === "add") {
      const result = AddMemberSchema.safeParse({
        name,
        groupId: group.id,
      });

      if (!result.success) {
        console.error("Invalid name:", result.error);
        return;
      }

      addMutation.mutate(
        { groupId: group.id, name: result.data.name },
        {
          // Stay open so several people can be added in a row.
          onSuccess: () => {
            form.reset();
            inputRef.current?.focus();
            toast.success(m.toolbar_member_added({ name: result.data.name }));
            router.invalidate();
          },
        },
      );
      return;
    }

    const result = UpdateMemberSchema.safeParse({
      groupId: group.id,
      memberId: (props as EditProps).memberId,
      name,
    });

    if (!result.success) {
      console.error("Invalid name:", result.error);
      return;
    }

    updateMutation.mutate(result.data, {
      onSuccess: () => {
        resetToolbar();
        router.invalidate();
      },
    });
  };

  const isAdd = intent === "add";
  const mutation = isAdd ? addMutation : updateMutation;

  // Edit but member not found (e.g. deleted)
  if (intent === "edit" && !member) {
    return null;
  }

  return (
    <form className="flex flex-col gap-3 px-3 py-2.5" onSubmit={handleSubmit}>
      {isAdd && members.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5 pr-8" aria-live="polite">
          {members.map((item) => (
            <li
              key={item.id}
              className="animate-in fade-in zoom-in-95 flex h-7 items-center gap-1.5 rounded-full bg-muted pl-1 pr-2.5 text-xs font-medium duration-200 ease-out"
            >
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full text-[10px] font-semibold",
                  getAvatarColorClasses(item.name),
                )}
              >
                {item.name.trim().charAt(0).toUpperCase()}
              </span>
              {item.name}
            </li>
          ))}
        </ul>
      ) : null}
      <Field aria-invalid={!!mutation.error}>
        <FieldLabel>{m.toolbar_field_name()}</FieldLabel>
        <Input
          ref={inputRef}
          required
          name="name"
          autoFocus
          autoComplete="off"
          autoCapitalize="words"
          enterKeyHint={isAdd ? "next" : "done"}
          defaultValue={intent === "edit" ? member?.name : ""}
          aria-invalid={!!mutation.error}
          onChange={() => mutation.error && mutation.reset()}
        />
      </Field>
      {mutation.error && (
        <FieldError errors={[{ message: getErrorMessage(mutation.error) }]} />
      )}
      <ButtonWithSpinner
        className="relative mt-3"
        text={
          isAdd ? m.toolbar_submit_add_member() : m.toolbar_submit_edit_member()
        }
        isPending={mutation.isPending}
      />
      {isAdd && members.length > 0 ? (
        <Button type="button" variant="ghost" onClick={resetToolbar}>
          {m.common_done()}
        </Button>
      ) : null}
      {intent === "edit" ? (
        <ConfirmDeleteButton
          label={m.content_delete_member_title()}
          warning={m.content_delete_member_description()}
          isPending={deleteMutation.isPending}
          onConfirm={() =>
            deleteMutation.mutate({ groupId: group.id, memberId: props.memberId })
          }
        />
      ) : null}
    </form>
  );
}
