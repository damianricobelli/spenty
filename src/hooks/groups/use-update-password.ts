import { removePassword, setPassword } from "@/api/group";
import type { GroupPassword } from "@/api/schema";
import { useAppMutation } from "../use-app-mutation";

export const useUpdateGroupPassword = () => {

  return useAppMutation({
    mutationFn: ({ password, groupId, intent }: GroupPassword) => {
      if (intent === "remove") {
        return removePassword({
          data: {
            password,
            groupId,
          },
        });
      }
      return setPassword({
        data: {
          password,
          groupId,
        },
      });
    },
    invalidateKeys: ["update-password"],
  });
};
