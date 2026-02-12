import { getGroupCategories } from "@/api/categories";
import { useAppQuery } from "../use-app-query";

export const groupCategoriesQueryKey = (groupId: string) =>
  ["groupCategories", groupId];

export function useGroupCategories(groupId: string) {
  return useAppQuery({
    queryKey: groupCategoriesQueryKey(groupId),
    queryFn: () => getGroupCategories({ data: { groupId } }),
    enabled: !!groupId,
  });
}
