import { Loader2Icon } from "lucide-react";
import { Button } from "./ui/button";

type ButtonWithSpinnerProps = {
  text: string;
  isPending: boolean;
} & React.ComponentProps<typeof Button>;

export const ButtonWithSpinner = ({
  text,
  isPending,
  type = "submit",
  ...rest
}: ButtonWithSpinnerProps) => {
  return (
    <Button type={type} disabled={isPending} aria-disabled={isPending} className="relative" {...rest}>
      {isPending && (
        <Loader2Icon className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />
      )}
      <span data-loading={isPending} className="data-[loading=true]:invisible">
        {text}
      </span>
    </Button>
  );
};
