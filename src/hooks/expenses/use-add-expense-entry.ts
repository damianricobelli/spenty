import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addExpenseEntry } from "@/api/expenses";
import type { AddExpenseEntry } from "@/api/schema";

export const useAddExpenseEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddExpenseEntry) => addExpenseEntry({ data }),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({
        queryKey: ["expenses", groupId],
      });
    },
  });
};
