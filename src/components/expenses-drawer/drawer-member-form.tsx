import { useLoaderData, useRouter } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
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
	resetDrawer: () => void;
};

type AddProps = BaseProps & {
	intent: "add";
};

type EditProps = BaseProps & {
	intent: "edit";
	memberId: string;
};

export type DrawerMemberFormProps = AddProps | EditProps;

export function DrawerMemberForm(props: DrawerMemberFormProps) {
	const { intent, resetDrawer } = props;
	const router = useRouter();
	const from = useEntity();
	const { group, members } = useLoaderData({ from });

	const addMutation = useAddMember();
	const updateMutation = useUpdateMember();

	const member =
		intent === "edit"
			? members.find((m) => m.id === (props as EditProps).memberId)
			: null;

	const [name, setName] = useState("");

	useEffect(() => {
		if (intent === "edit" && member) {
			setName(member.name);
		}
	}, [intent, member]);

	const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const rawName = formData.get("name");

		if (intent === "add") {
			const result = AddMemberSchema.safeParse({
				name: rawName,
				groupId: group.id,
			});
			if (!result.success) {
				console.error("Invalid name:", result.error);
				return;
			}
			addMutation.mutate(
				{ groupId: group.id, name: result.data.name.trim() },
				{
					onSuccess: () => {
						resetDrawer();
						router.invalidate();
					},
				},
			);
			return;
		}

		const result = UpdateMemberSchema.safeParse({
			groupId: group.id,
			memberId: (props as EditProps).memberId,
			name: rawName,
		});
		if (!result.success) {
			console.error("Invalid name:", result.error);
			return;
		}
		updateMutation.mutate(result.data, {
			onSuccess: () => {
				resetDrawer();
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
		<form className="flex flex-col gap-4 p-4" onSubmit={handleSubmit}>
			<Field aria-invalid={!!mutation.error}>
				<FieldLabel>{m.drawer_field_name()}</FieldLabel>
				<Input
					required
					name="name"
					value={name}
					onChange={(e) => {
						const v = e.target.value;
						setName(v.charAt(0).toUpperCase() + v.slice(1));
					}}
					aria-invalid={!!mutation.error}
				/>
			</Field>
			{mutation.error && (
				<FieldError
					errors={[{ message: getErrorMessage(mutation.error) }]}
				/>
			)}
			<ButtonWithSpinner
				text={
					isAdd ? m.drawer_submit_add_member() : m.drawer_submit_edit_member()
				}
				isPending={mutation.isPending}
			/>
		</form>
	);
}
