import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { m } from "@/paraglide/messages";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { useValidateCode } from "@/hooks/use-validate-code";

import { CodeSchema } from "@/api/code";

export const SearchCode = () => {
  const validateCode = useValidateCode();

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const code = formData.get("code");
    const result = CodeSchema.safeParse({ code });

    if (result.success) {
      validateCode.mutate({ code: result.data.code });
    } else {
      console.error("Invalid code:", result.error);
    }
  };

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="ghost" className="bg-muted">
            {m.home_page_search_code_button()}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{m.home_page_search_code_dialog_title()}</DialogTitle>
          <DialogDescription>
            {m.home_page_search_code_dialog_description()}
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <div className="grid flex-1 gap-2 mx-auto">
            <Label htmlFor="code" className="sr-only">
              {m.home_page_search_code_label_link()}
            </Label>
            <InputOTP
              maxLength={8}
              pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
              required
              name="code"
              onChange={() => {
                if (validateCode.error) {
                  validateCode.reset();
                }
              }}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} aria-invalid={!!validateCode.error} />
                <InputOTPSlot index={1} aria-invalid={!!validateCode.error} />
                <InputOTPSlot index={2} aria-invalid={!!validateCode.error} />
                <InputOTPSlot index={3} aria-invalid={!!validateCode.error} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={4} aria-invalid={!!validateCode.error} />
                <InputOTPSlot index={5} aria-invalid={!!validateCode.error} />
                <InputOTPSlot index={6} aria-invalid={!!validateCode.error} />
                <InputOTPSlot index={7} aria-invalid={!!validateCode.error} />
              </InputOTPGroup>
            </InputOTP>
            {validateCode.error && (
              <p className="text-destructive">
                {m.home_page_search_code_not_found()}
              </p>
            )}
          </div>
          <DialogFooter className="sm:justify-end gap-2">
            <DialogClose
              render={
                <Button variant="ghost">
                  {m.home_page_search_code_cancel()}
                </Button>
              }
            />
            <Button type="submit">{m.home_page_search_code_submit()}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
