import { validateCode } from "@/api/code";
import { useMutation } from "@tanstack/react-query";

export const useValidateCode = () => {
  return useMutation({
    mutationFn: ({ code }: { code: string }) => {
      return validateCode({ data: { code } });
    },
    mutationKey: ["validate-code"],
  });
};
