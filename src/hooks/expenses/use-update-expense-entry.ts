import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateExpenseEntry } from "@/api/expenses";
import type { UpdateExpenseEntry } from "@/api/schema";

export const useUpdateExpenseEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateExpenseEntry) => updateExpenseEntry({ data }),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({
        queryKey: ["expenses", groupId],
      });
    },
  });
};
