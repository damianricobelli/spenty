import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteGroupCategory } from "@/api/categories";
import type { DeleteGroupCategory } from "@/api/schema";
import { groupCategoriesQueryKey } from "./use-group-categories";

export function useDeleteGroupCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DeleteGroupCategory) =>
      deleteGroupCategory({ data }),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({
        queryKey: groupCategoriesQueryKey(groupId),
      });
    },
  });
}
