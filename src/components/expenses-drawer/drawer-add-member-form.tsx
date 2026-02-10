import { useLoaderData, useRouter } from "@tanstack/react-router";
import { AddMemberSchema } from "@/api/schema";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAddMember } from "@/hooks/members/use-add-member";
import { useEntity } from "@/hooks/use-entity";
import { getErrorMessage } from "@/lib/get-error-message";
import { m } from "@/paraglide/messages";
import { ButtonWithSpinner } from "../button-with-spinner";

export function DrawerAddMemberForm({
	resetDrawer,
}: {
	resetDrawer: () => void;
}) {
	const router = useRouter();
	const from = useEntity();
	const { group } = useLoaderData({
		from,
	});
	const addMemberMutation = useAddMember();

	const handleAddMember = (e: React.SyntheticEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const memberName = formData.get("name");

		const result = AddMemberSchema.safeParse({
			name: memberName,
			groupId: group.id,
		});
		if (!result.success) {
			console.error("Invalid name:", result.error);
			return;
		}

		addMemberMutation.mutate(
			{ groupId: group.id, name: result.data.name.trim() },
			{
				onSuccess: () => {
					resetDrawer();
					router.invalidate();
				},
			},
		);
	};

	return (
		<form className="flex flex-col gap-4 p-4" onSubmit={handleAddMember}>
			<Field aria-invalid={!!addMemberMutation.error}>
				<FieldLabel>{m.drawer_field_name()}</FieldLabel>
				<Input
					required
					name="name"
					aria-invalid={!!addMemberMutation.error}
					onInput={(e) => {
						const input = e.currentTarget;
						input.value =
							input.value.charAt(0).toUpperCase() + input.value.slice(1);
					}}
				/>
			</Field>
			{addMemberMutation.error && (
				<FieldError
					errors={[{ message: getErrorMessage(addMemberMutation.error) }]}
				/>
			)}
			<ButtonWithSpinner
				text={m.drawer_submit_add_member()}
				isPending={addMemberMutation.isPending}
			/>
		</form>
	);
}
