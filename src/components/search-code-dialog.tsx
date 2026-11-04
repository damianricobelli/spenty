import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { useRef } from "react";
import { CodeSchema } from "@/api/schema";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useValidateCode } from "@/hooks/use-validate-code";
import { m } from "@/paraglide/messages";
import { ButtonWithSpinner } from "./button-with-spinner";
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

export const SearchCode = () => {
  const validateCode = useValidateCode();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const code = formData.get("code");
    const result = CodeSchema.safeParse({ code });

    if (result.success && !validateCode.isPending) {
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
        <form
          ref={formRef}
          className="flex flex-col gap-6"
          onSubmit={handleSubmit}
        >
          <div className="grid flex-1 gap-2 mx-auto">
            <Label htmlFor="code" className="sr-only">
              {m.home_page_search_code_label_link()}
            </Label>
            <InputOTP
              maxLength={8}
              pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
              inputMode="text"
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="go"
              autoFocus
              required
              name="code"
              // Typing or pasting the 8th character opens the group right away.
              onComplete={() => formRef.current?.requestSubmit()}
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
              <p className="animate-in fade-in text-center text-sm text-destructive duration-200">
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
            <ButtonWithSpinner
              text={m.home_page_search_code_submit()}
              isPending={validateCode.isPending}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
