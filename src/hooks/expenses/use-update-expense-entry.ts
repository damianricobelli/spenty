import { updateExpenseEntry } from "@/api/expenses";
import type { UpdateExpenseEntry } from "@/api/schema";
import { useAppMutation } from "../use-app-mutation";

export const useUpdateExpenseEntry = () => {

  return useAppMutation({
    mutationFn: (data: UpdateExpenseEntry) => updateExpenseEntry({ data }),
    invalidateKeys: (_, { groupId }) => ["expenses", groupId],
  });
};
