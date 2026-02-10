import { useLoaderData, useRouter } from "@tanstack/react-router";
import {
  EyeIcon,
  EyeOffIcon,
  Loader2Icon,
  LockIcon,
  UnlockIcon,
} from "lucide-react";
import { useState } from "react";
import { removePassword, setPassword } from "@/api/group";
import { type GroupPassword, PasswordSchema } from "@/api/schema";
import { useAppMutation } from "@/hooks/use-app-mutation";
import { getErrorMessage } from "@/lib/get-error-message";
import { setGroupUnlocked } from "@/lib/unlocked-groups";
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
import { Field, FieldError, FieldLabel } from "./ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./ui/input-group";

type Mode = "unlock" | "remove" | "set";

export const PasswordDialog = ({
  from,
  defaultOpen,
  open: controlledOpen,
  onOpenChange: controlledSetOpen,
}: {
  from: "expenses" | "splits";
  defaultOpen: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) => {
  const router = useRouter();
  const { group } = useLoaderData({
    from: from === "expenses" ? "/expenses/$id" : "/splits/$id",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  const isControlled = controlledOpen !== undefined && controlledSetOpen != null;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledSetOpen : setInternalOpen;

  const isUnlockMode = defaultOpen && !!group.password;

  const mode: Mode = isUnlockMode
    ? "unlock"
    : group.password
      ? "remove"
      : "set";

  const titleByMode = {
    unlock: m.password_unlock_title(),
    remove: m.password_remove_title(),
    set: m.password_set_title(),
  };

  const descriptionByMode = {
    unlock: m.password_unlock_description(),
    remove: m.password_remove_description(),
    set: m.password_set_description(),
  };

  const placeholderByMode = {
    unlock: m.password_unlock_placeholder(),
    remove: m.password_remove_placeholder(),
    set: m.password_set_placeholder(),
  };

  const submitLabelByMode = {
    unlock: m.password_unlock_submit(),
    remove: m.password_remove_submit(),
    set: m.password_set_submit(),
  };

  const updatePassword = useAppMutation<void, string, GroupPassword>({
    mutationFn: ({ password, groupId, intent }) => {
      if (intent === "remove") {
        return removePassword({
          data: { password, groupId },
        });
      }

      return setPassword({
        data: { password, groupId },
      });
    },
    onSuccess: (_, variables) => {
      setGroupUnlocked(variables.groupId, variables.intent === "set");
      router.invalidate();
      setOpen(false);
    },
    invalidateKeys: ["update-password"],
  });

  const handleUpdatePasswordSubmit = async (
    e: React.SyntheticEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password");

    const result = PasswordSchema.safeParse({ password });

    if (!result.success) {
      console.error("Invalid password:", result.error);
      return;
    }

    if (mode === "unlock") {
      if (result.data.password.trim() === group.password) {
        setGroupUnlocked(group.id, true);
        setUnlockError(null);
        setOpen(false);
        router.invalidate();
      } else {
        setUnlockError(m.password_incorrect());
      }
      return;
    }

    updatePassword.mutate({
      groupId: group.id,
      password: result.data.password,
      intent: mode === "remove" ? "remove" : "set",
    });
  };

  return (
    <Dialog open={open} onOpenChange={defaultOpen ? undefined : setOpen}>
      {!defaultOpen && !isControlled && (
        <DialogTrigger
          render={(domProps) => (
            <Button variant="ghost" size="icon-sm" {...domProps}>
              {group.password ? <LockIcon /> : <UnlockIcon />}
            </Button>
          )}
        />
      )}

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{titleByMode[mode]}</DialogTitle>
          <DialogDescription>{descriptionByMode[mode]}</DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-6"
          onSubmit={handleUpdatePasswordSubmit}
        >
          <div className="grid flex-1 gap-2">
            <Field className="max-w-sm" aria-invalid={!!updatePassword.error}>
              <FieldLabel htmlFor="password" className="sr-only">
                {m.password_label()}
              </FieldLabel>

              <InputGroup>
                <InputGroupInput
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={placeholderByMode[mode]}
                  required
                  aria-invalid={!!updatePassword.error}
                />
                <InputGroupAddon align="inline-end" className="cursor-default">
                  {showPassword ? (
                    <EyeOffIcon onClick={() => setShowPassword(false)} />
                  ) : (
                    <EyeIcon onClick={() => setShowPassword(true)} />
                  )}
                </InputGroupAddon>
              </InputGroup>
              {(unlockError || updatePassword.error) && (
                <FieldError errors={[{ message: getErrorMessage(updatePassword.error) }]} />
              )}
            </Field>
          </div>

          <DialogFooter className="sm:justify-end gap-2">
            {mode !== "unlock" && (
              <DialogClose
                render={
                  <Button variant="ghost">
                    {m.home_page_search_code_cancel()}
                  </Button>
                }
              />
            )}

            <Button type="submit" className="relative">
              {updatePassword.isPending && (
                <Loader2Icon className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />
              )}
              <span
                data-loading={updatePassword.isPending}
                className="data-[loading=true]:invisible"
              >
                {submitLabelByMode[mode]}
              </span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
