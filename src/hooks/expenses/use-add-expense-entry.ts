import { addExpenseEntry } from "@/api/expenses";
import type { AddExpenseEntry } from "@/api/schema";
import { useAppMutation } from "../use-app-mutation";

export const useAddExpenseEntry = () => {

  return useAppMutation({
    mutationFn: (data: AddExpenseEntry) => addExpenseEntry({ data }),
    invalidateKeys: (_, { groupId }) => ["expenses", groupId],
  });
};
