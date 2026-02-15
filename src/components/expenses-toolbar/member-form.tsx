import { useLoaderData, useRouter } from "@tanstack/react-router";
import type React from "react";
import { AddMemberSchema, UpdateMemberSchema } from "@/api/schema";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAddMember } from "@/hooks/members/use-add-member";
import { useUpdateMember } from "@/hooks/members/use-update-member";
import { useEntity } from "@/hooks/use-entity";
import { getErrorMessage } from "@/lib/get-error-message";
import { m } from "@/paraglide/messages";
import { ButtonWithSpinner } from "../button-with-spinner";

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

	const member =
		intent === "edit"
			? members.find((m) => m.id === (props as EditProps).memberId)
			: null;

	const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
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
					onSuccess: () => {
						resetToolbar();
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
			<Field aria-invalid={!!mutation.error}>
				<FieldLabel>{m.toolbar_field_name()}</FieldLabel>
				<Input
					required
					name="name"
					defaultValue={intent === "edit" ? member?.name : ""}
					aria-invalid={!!mutation.error}
				/>
			</Field>
			{mutation.error && (
				<FieldError errors={[{ message: getErrorMessage(mutation.error) }]} />
			)}
			<ButtonWithSpinner
				text={
					isAdd ? m.toolbar_submit_add_member() : m.toolbar_submit_edit_member()
				}
				isPending={mutation.isPending}
			/>
		</form>
	);
}
