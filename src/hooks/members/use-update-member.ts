import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateMember } from "@/api/members";
import type { UpdateMember } from "@/api/schema";

export const useUpdateMember = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: UpdateMember) => updateMember({ data }),
		onSuccess: (_, { groupId }) => {
			queryClient.invalidateQueries({
				queryKey: ["members", groupId],
			});
		},
	});
};
