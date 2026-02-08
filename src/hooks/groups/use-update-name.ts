import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateGroupName } from "@/api/group";
import type { UpdateGroupName } from "@/api/schema";
import { getErrorMessage } from "@/lib/get-error-message";

export const useUpdateGroupName = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, groupId }: UpdateGroupName) =>
      updateGroupName({ data: { name, groupId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["update-name"],
      });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
};
