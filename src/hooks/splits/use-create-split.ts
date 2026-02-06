import { createNewSplit } from "@/routes/splits/api.create";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateSplit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => createNewSplit(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["splits"],
      });
    },
  });
};
