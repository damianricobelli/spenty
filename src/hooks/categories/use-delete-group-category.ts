import { deleteGroupCategory } from "@/api/categories";
import type { DeleteGroupCategory } from "@/api/schema";
import { useAppMutation } from "../use-app-mutation";
import { groupCategoriesQueryKey } from "./use-group-categories";

export function useDeleteGroupCategory() {
  return useAppMutation({
    mutationFn: (data: DeleteGroupCategory) =>
      deleteGroupCategory({ data }),
    invalidateKeys: (_, { groupId }) => groupCategoriesQueryKey(groupId),
  });
}
