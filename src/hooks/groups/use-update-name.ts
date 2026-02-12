import { toast } from "sonner";
import { updateGroupName } from "@/api/group";
import type { UpdateGroupName } from "@/api/schema";
import { getErrorMessage } from "@/lib/get-error-message";
import { useAppMutation } from "../use-app-mutation";

export const useUpdateGroupName = () => {

  return useAppMutation({
    mutationFn: ({ name, groupId }: UpdateGroupName) =>
      updateGroupName({ data: { name, groupId } }),
    invalidateKeys: ["update-name"],
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
};
