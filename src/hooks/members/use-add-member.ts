import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addMember } from "@/api/members";
import type { AddMember } from "@/api/schema";

export const useAddMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddMember) => addMember({ data }),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({
        queryKey: ["members", groupId],
      });
    },
  });
};
