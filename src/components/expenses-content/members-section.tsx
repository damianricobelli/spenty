import { useLoaderData } from "@tanstack/react-router";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeleteMember } from "@/hooks/members/use-delete-member";
import { useEntity } from "@/hooks/use-entity";
import { getAvatarColorClasses } from "@/lib/avatar-colors";
import { cn } from "@/lib/cn";
import { listItem, reducedFade, springGentle } from "@/lib/motion";
import { m } from "@/paraglide/messages";
import { ButtonWithSpinner } from "../button-with-spinner";
import { useExpensesToolbarActions } from "../expenses-toolbar";

export function MembersSection() {
  const entity = useEntity();
  const { members } = useLoaderData({ from: entity });
  const reduceMotion = useReducedMotion();

  const toolbarActions = useExpensesToolbarActions();

  const deleteMemberIdRef = useRef<string>(null);

  const [isDeleteMemberDialogOpen, setIsDeleteMemberDialogOpen] =
    useState(false);

  const transition = reduceMotion ? reducedFade : springGentle;

  return (
    <>
      <section>
        <h2 className="mb-3 text-md font-medium text-muted-foreground">
          {m.content_section_members()}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <AnimatePresence initial={false}>
            {members.map((member) => (
              <motion.div
                key={member.id}
                layout={reduceMotion ? false : "position"}
                initial={listItem.initial}
                animate={listItem.animate}
                exit={listItem.exit}
                transition={transition}
              >
                <MemberChip
                  member={member}
                  onEdit={
                    toolbarActions
                      ? () => toolbarActions.openEditMember(member.id)
                      : undefined
                  }
                  onDelete={() => {
                    deleteMemberIdRef.current = member.id;
                    setIsDeleteMemberDialogOpen(true);
                  }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>
      <DeleteMemberDialog
        open={isDeleteMemberDialogOpen}
        onOpenChange={setIsDeleteMemberDialogOpen}
        memberId={deleteMemberIdRef.current}
      />
    </>
  );
}

function MemberChip({
  member,
  onEdit,
  onDelete,
}: {
  member: { id: string; name: string };
  onEdit?: () => void;
  onDelete: () => void;
}) {
  const initial = member.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="bg-muted text-foreground border-border/60 flex h-9 w-fit items-center gap-2 rounded-full border pl-1.5 pr-3 text-sm font-medium shadow-sm transition-all hover:shadow-md hover:border-border whitespace-nowrap">
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
            getAvatarColorClasses(member.name),
          )}
        >
          {initial}
        </span>
        <span>{member.name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-36">
        {onEdit && (
          <DropdownMenuItem onClick={() => onEdit()}>
            <PencilIcon />
            {m.content_edit()}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          variant="destructive"
          onClick={() => onDelete()}
        >
          <Trash2Icon />
          {m.content_delete()}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DeleteMemberDialog({
  open,
  onOpenChange,
  memberId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string | null;
}) {
  const entity = useEntity();
  const { group } = useLoaderData({ from: entity });

  const deleteMemberMutation = useDeleteMember(group.id, {
    onSuccess: () => {
      onOpenChange(false);
    },
  });

  const handleConfirmDeleteMember = () => {
    if (!memberId) return;
    deleteMemberMutation.mutate({ groupId: group.id, memberId });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          onOpenChange(false);
        }
      }}
    >
      <DialogContent showCloseButton={true}>
        <DialogHeader>
          <DialogTitle>{m.content_delete_member_title()}</DialogTitle>
          <DialogDescription>
            {m.content_delete_member_description()}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter showCloseButton={false}>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={deleteMemberMutation.isPending}
          >
            {m.content_cancel()}
          </Button>
          <ButtonWithSpinner
            type="button"
            isPending={deleteMemberMutation.isPending}
            text={m.content_delete()}
            onClick={handleConfirmDeleteMember}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
