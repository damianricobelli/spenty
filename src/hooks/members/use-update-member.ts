import { updateMember } from "@/api/members";
import type { UpdateMember } from "@/api/schema";
import { useAppMutation } from "../use-app-mutation";

export const useUpdateMember = () => {

  return useAppMutation({
    mutationFn: (data: UpdateMember) => updateMember({ data }),
    invalidateKeys: (_, { groupId }) => ["members", groupId],
  });
};
