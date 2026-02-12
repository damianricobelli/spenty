import { useQuery } from "@tanstack/react-query";
import { getGroupCategories } from "@/api/categories";

export const groupCategoriesQueryKey = (groupId: string) =>
  ["groupCategories", groupId] as const;

export function useGroupCategories(groupId: string) {
  return useQuery({
    queryKey: groupCategoriesQueryKey(groupId),
    queryFn: () => getGroupCategories({ data: { groupId } }),
    enabled: !!groupId,
  });
}
