import { toast } from "sonner";
import { deleteGroup } from "@/api/group";
import type { DeleteGroup } from "@/api/schema";
import { getErrorMessage } from "@/lib/get-error-message";
import { useAppMutation } from "../use-app-mutation";

export function useDeleteGroup() {
  return useAppMutation({
    mutationFn: ({ groupId, name }: DeleteGroup) =>
      deleteGroup({ data: { groupId, name } }),
    invalidateKeys: [],
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
