import { addMember } from "@/api/members";
import type { AddMember } from "@/api/schema";
import { useAppMutation } from "../use-app-mutation";

export const useAddMember = () => {

  return useAppMutation({
    mutationFn: (data: AddMember) => addMember({ data }),
    invalidateKeys: (_, { groupId }) => ["members", groupId],
  });
};
