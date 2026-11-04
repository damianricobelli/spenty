import { useLoaderData, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useDeleteGroup } from "@/hooks/groups/use-delete-group";
import { forgetGroup } from "@/lib/recent-groups";
import { useEntity } from "@/hooks/use-entity";
import { getErrorMessage } from "@/lib/get-error-message";
import { isDefaultGroupName } from "@/lib/group-name";
import { m } from "@/paraglide/messages";
import { ButtonWithSpinner } from "./button-with-spinner";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Field, FieldError, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";

export function DeleteGroupDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const from = useEntity();
  const { group } = useLoaderData({ from });
  const router = useRouter();
  const [confirmName, setConfirmName] = useState("");
  const deleteGroupMutation = useDeleteGroup();

  // Typing the name back only makes sense when the user actually named the
  // group; default/placeholder names get a plain confirm instead.
  const requiresTypedConfirm = !isDefaultGroupName(group.name);

  const nameMatches =
    !requiresTypedConfirm ||
    confirmName.trim().toLowerCase() === group.name.trim().toLowerCase();

  const handleConfirm = () => {
    if (!nameMatches) return;
    deleteGroupMutation.mutate(
      { groupId: group.id, name: requiresTypedConfirm ? confirmName.trim() : group.name },
      {
        onSuccess: () => {
          onOpenChange(false);
          forgetGroup(group.slug);
          router.navigate({ to: "/" });
        },
      },
    );
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) setConfirmName("");
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={true}>
        <DialogHeader>
          <DialogTitle>{m.header_delete_group_title()}</DialogTitle>
          <DialogDescription>
            {requiresTypedConfirm
              ? m.header_delete_group_description()
              : m.header_delete_group_description_simple()}
          </DialogDescription>
        </DialogHeader>
        {requiresTypedConfirm && (
          <Field aria-invalid={!!deleteGroupMutation.error}>
            <FieldLabel htmlFor="delete-group-name">
              {m.header_delete_group_confirm_label()}
            </FieldLabel>
            <Input
              id="delete-group-name"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={group.name || m.header_group_name_placeholder()}
              className="font-mono"
              autoComplete="off"
              aria-invalid={!!deleteGroupMutation.error}
            />
            {deleteGroupMutation.error && (
              <FieldError
                errors={[
                  { message: getErrorMessage(deleteGroupMutation.error) },
                ]}
              />
            )}
          </Field>
        )}
        {!requiresTypedConfirm && deleteGroupMutation.error && (
          <FieldError
            errors={[{ message: getErrorMessage(deleteGroupMutation.error) }]}
          />
        )}
        <DialogFooter showCloseButton={false}>
          <Button
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            disabled={deleteGroupMutation.isPending}
          >
            {m.content_cancel()}
          </Button>
          <ButtonWithSpinner
            type="button"
            variant="destructive"
            isPending={deleteGroupMutation.isPending}
            disabled={deleteGroupMutation.isPending || !nameMatches}
            text={m.content_delete()}
            onClick={handleConfirm}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
