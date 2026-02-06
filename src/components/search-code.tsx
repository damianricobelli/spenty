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

export const SearchCode = () => {
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
        <div className="flex items-center gap-2">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="link" className="sr-only">
              {m.home_page_search_code_label_link()}
            </Label>
            <InputOTP maxLength={8} pattern={REGEXP_ONLY_DIGITS_AND_CHARS}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
                <InputOTPSlot index={6} />
                <InputOTPSlot index={7} />
              </InputOTPGroup>
            </InputOTP>
          </div>
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
      </DialogContent>
    </Dialog>
  );
};
