import { createGroupCategory } from "@/api/categories";
import type { CreateGroupCategory } from "@/api/schema";
import { useAppMutation } from "@/hooks/use-app-mutation";
import { groupCategoriesQueryKey } from "./use-group-categories";

export function useCreateGroupCategory() {
  return useAppMutation({
    mutationFn: (data: CreateGroupCategory) =>
      createGroupCategory({ data }),
    invalidateKeys: (_, { groupId }) => groupCategoriesQueryKey(groupId),
  });
}