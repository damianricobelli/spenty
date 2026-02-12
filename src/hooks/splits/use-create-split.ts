import { createNewSplit } from "@/api/splits";
import { useAppMutation } from "../use-app-mutation";

export const useCreateSplit = () => {

  return useAppMutation({
    mutationFn: (defaultName: string) =>
      createNewSplit({ data: { defaultName } }),
    invalidateKeys: ["splits"],
  });
};
