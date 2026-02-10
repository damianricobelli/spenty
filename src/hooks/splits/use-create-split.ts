import { createNewSplit } from "@/api/splits";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateSplit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (defaultName: string) =>
      createNewSplit({ data: { defaultName } }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["splits"],
      });
    },
  });
};
