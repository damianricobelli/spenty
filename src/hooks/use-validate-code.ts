import { useQuery } from "@tanstack/react-query";
import { validateCode } from "@/routes/api.validate-code";

export const useValidateCode = ({ code }: { code: string }) => {
  return useQuery({
    queryFn: () => validateCode({ data: { code } }),
    queryKey: ["validate-code"],
  });
};
