import { createNewExpense } from "@/routes/expenses/api.create";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => createNewExpense(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["expenses"],
      });
    },
  });
};
