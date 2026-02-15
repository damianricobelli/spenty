import { useLoaderData } from "@tanstack/react-router";
import { PencilIcon, Trash2Icon } from "lucide-react";
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
import { useDeleteMember } from "@/hooks/members/use-delete-member";
import { useEntity } from "@/hooks/use-entity";
import { m } from "@/paraglide/messages";
import { ButtonWithSpinner } from "../button-with-spinner";
import { useExpensesToolbarActions } from "../expenses-toolbar";

export function MembersSection() {
	const entity = useEntity();
	const { members } = useLoaderData({ from: entity });

	const toolbarActions = useExpensesToolbarActions();

	const deleteMemberIdRef = useRef<string>(null);

	const [isDeleteMemberDialogOpen, setIsDeleteMemberDialogOpen] =
		useState(false);

	return (
		<>
			<section>
				<h2 className="mb-3 text-md font-medium text-muted-foreground">
					{m.content_section_members()}
				</h2>
				<div className="flex flex-wrap items-center gap-2">
					{members.map((member) => {
						const initial = member.name.trim().charAt(0).toUpperCase() || "?";
						return (
							<span
								key={member.id}
								className="bg-muted text-foreground border-border/60 group flex h-9 w-fit items-center gap-2 rounded-full border pl-1.5 pr-1 text-sm font-medium shadow-sm transition-shadow hover:shadow-md whitespace-nowrap"
							>
								<span className="bg-muted-foreground/15 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-foreground">
									{initial}
								</span>
								<span className="pr-0.5">{member.name}</span>
								<div className="flex items-center gap-0">
									{toolbarActions && (
										<Button
											type="button"
											variant="ghost"
											size="icon-xs"
											className="shrink-0 rounded-full opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10"
											aria-label={m.content_edit()}
											onClick={() => toolbarActions.openEditMember(member.id)}
										>
											<PencilIcon className="size-3.5" />
										</Button>
									)}
									<Button
										type="button"
										variant="ghost"
										size="icon-xs"
										className="shrink-0 rounded-full opacity-60 hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
										aria-label={m.content_delete()}
										onClick={() => {
											deleteMemberIdRef.current = member.id;
											setIsDeleteMemberDialogOpen(true);
										}}
									>
										<Trash2Icon className="size-3.5" />
									</Button>
								</div>
							</span>
						);
					})}
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
