import { useLoaderData, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useDeleteGroup } from "@/hooks/groups/use-delete-group";
import { useEntity } from "@/hooks/use-entity";
import { getErrorMessage } from "@/lib/get-error-message";
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

  const nameMatches =
    confirmName.trim().toLowerCase() === group.name.trim().toLowerCase();

  const handleConfirm = () => {
    if (!nameMatches) return;
    deleteGroupMutation.mutate(
      { groupId: group.id, name: confirmName.trim() },
      {
        onSuccess: () => {
          onOpenChange(false);
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
            {m.header_delete_group_description()}
          </DialogDescription>
        </DialogHeader>
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
              errors={[{ message: getErrorMessage(deleteGroupMutation.error) }]}
            />
          )}
        </Field>
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
            text={m.content_delete()}
            onClick={handleConfirm}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
