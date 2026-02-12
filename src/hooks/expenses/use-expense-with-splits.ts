import { getExpenseWithSplits } from "@/api/expenses";
import { useAppQuery } from "../use-app-query";

export const expenseWithSplitsQueryKey = (expenseId: string) =>
  ["expenseWithSplits", expenseId];

export function useExpenseWithSplits(expenseId: string, enabled = true) {
  return useAppQuery({
    queryKey: expenseWithSplitsQueryKey(expenseId),
    queryFn: () => getExpenseWithSplits({ data: { expenseId } }),
    enabled: enabled && !!expenseId,
  });
}
