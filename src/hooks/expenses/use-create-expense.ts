import { createNewExpense } from "@/api/expenses";
import { useAppMutation } from "../use-app-mutation";

export const useCreateExpense = () => {

  return useAppMutation({
    mutationFn: (defaultName: string) =>
      createNewExpense({ data: { defaultName } }),
    invalidateKeys: ["expenses"],
  });
};
