import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createGroupCategory } from "@/api/categories";
import type { CreateGroupCategory } from "@/api/schema";
import { groupCategoriesQueryKey } from "./use-group-categories";

export function useCreateGroupCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGroupCategory) =>
      createGroupCategory({ data }),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({
        queryKey: groupCategoriesQueryKey(groupId),
      });
    },
  });
}
