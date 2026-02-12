import { validateCode } from "@/api/code";
import { useAppMutation } from "./use-app-mutation";

export const useValidateCode = () => {
  return useAppMutation({
    mutationFn: ({ code }: { code: string }) => {
      return validateCode({ data: { code } });
    },
    invalidateKeys: ["validate-code"],
  });
};
