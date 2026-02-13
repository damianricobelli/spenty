import { useRouter } from "@tanstack/react-router";
import { deleteExpense } from "@/api/expenses";
import type { DeleteExpense } from "@/api/schema";
import { useAppMutation } from "../use-app-mutation";

type Options = {
	onSuccess?: () => void;
};

export function useDeleteExpense(groupId: string, options?: Options) {
	const router = useRouter();

	return useAppMutation({
		mutationFn: (data: DeleteExpense) => deleteExpense({ data }),
		invalidateKeys: ["expenses", groupId],
		onSuccess: () => {
			router.invalidate();
			options?.onSuccess?.();
		},
	});
}
