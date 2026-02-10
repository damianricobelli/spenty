import { Loader2Icon } from "lucide-react";
import { Button } from "./ui/button";

export const ButtonWithSpinner = ({
  text,
  isPending,
}: {
  text: string;
  isPending: boolean;
}) => {
  return (
    <Button type="submit" className="relative">
      {isPending && (
        <Loader2Icon className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />
      )}
      <span data-loading={isPending} className="data-[loading=true]:invisible">
        {text}
      </span>
    </Button>
  );
};
