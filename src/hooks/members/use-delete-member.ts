import { useRouter } from "@tanstack/react-router";
import { deleteMember } from "@/api/members";
import type { DeleteMember } from "@/api/schema";
import { useAppMutation } from "../use-app-mutation";

type Options = {
	onSuccess?: () => void;
};

export function useDeleteMember(groupId: string, options?: Options) {
	const router = useRouter();

	return useAppMutation({
		mutationFn: (data: DeleteMember) => deleteMember({ data }),
		invalidateKeys: ["members", groupId],
		onSuccess: () => {
			router.invalidate();
			options?.onSuccess?.();
		},
	});
}
