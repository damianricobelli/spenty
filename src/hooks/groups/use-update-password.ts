import { useMutation, useQueryClient } from "@tanstack/react-query";
import { removePassword, setPassword } from "@/api/group";
import type { GroupPassword } from "@/api/schema";

export const useUpdateGroupPassword = () => {
  const queryClient = useQueryClient();

  return useMutation({
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
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["update-password"],
      });
    },
  });
};
