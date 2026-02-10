import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createNewExpense } from "@/api/expenses";

export const useCreateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (defaultName: string) =>
      createNewExpense({ data: { defaultName } }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["expenses"],
      });
    },
  });
};
