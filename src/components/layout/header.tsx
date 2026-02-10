import { Link, useLoaderData, useRouter } from "@tanstack/react-router";
import {
  ArrowLeftIcon,
  GlobeIcon,
  LockIcon,
  SettingsIcon,
  ShareIcon,
  UnlockIcon,
} from "lucide-react";
import React, { useState, useTransition } from "react";
import { toast } from "sonner";

import { PasswordDialog } from "@/components/password-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

import { useUpdateGroupName } from "@/hooks/groups/use-update-name";
import { useEntity } from "@/hooks/use-entity";
import { localeFlags } from "@/lib/locale-flags";
import { isGroupUnlocked } from "@/lib/unlocked-groups";
import { m } from "@/paraglide/messages";
import {
  getLocale,
  type Locale,
  locales,
  setLocale,
} from "@/paraglide/runtime";

export function Header() {
  const from = useEntity();
  const { group } = useLoaderData({
    from,
  });
  const router = useRouter();

  const updateName = useUpdateGroupName();

  const isUnnamed = !group.name.trim();
  const [groupName, setGroupName] = useState(isUnnamed ? "" : group.name);

  const [_, startTransition] = useTransition();

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  const handleUpdateGroupName = async () => {
    if (!groupName.trim()) {
      setGroupName(group.name);
      return;
    }
    setGroupName(groupName);
    startTransition(() => {
      updateName.mutate({ name: groupName, groupId: group.id });
      router.invalidate();
    });
  };

  const copyCode = () => {
    try {
      navigator.clipboard.writeText(group.slug);
      toast.success(m.header_copy_code_toast());
    } catch (error) {
      console.error("Failed to copy code:", error);
    }
  };

  if (group.password && !isGroupUnlocked(group.id)) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <PasswordDialog defaultOpen={true} />
      </main>
    );
  }

  return (
    <React.Fragment>
      <header className="sticky top-0 z-20 h-[var(--header-offset)] flex items-center border-b border-border/60 bg-background/95 px-4 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3">
          <Link
            to="/"
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={m.header_back_aria_label()}
          >
            <ArrowLeftIcon className="size-5" />
          </Link>

          <div className="min-w-0 flex-1 flex flex-col items-center justify-center py-0.5">
            <div className="flex h-8 items-center">
              <Input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                onBlur={handleUpdateGroupName}
                placeholder={m.header_group_name_placeholder()}
                className="w-64 text-center font-semibold bg-transparent not-focus-within:border-none uppercase tracking-wider text-muted-foreground"
                aria-invalid={
                  !!updateName.error || groupName.trim().length === 0
                }
              />
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-lg"
                  className="rounded-full text-muted-foreground"
                  aria-label={m.header_settings_aria_label()}
                >
                  <SettingsIcon />
                </Button>
              }
            />
            <DropdownMenuContent align="end" side="top" sideOffset={8}>
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault();
                  copyCode();
                }}
              >
                <ShareIcon />
                {m.header_share_code()}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault();
                  setPasswordDialogOpen(true);
                }}
              >
                {group.password ? <LockIcon /> : <UnlockIcon />}
                {group.password
                  ? m.header_change_remove_password()
                  : m.header_protect_with_password()}
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <GlobeIcon />
                  {m.header_language()}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup
                    value={getLocale()}
                    onValueChange={(v) => setLocale(v as Locale)}
                  >
                    {locales.map((locale) => (
                      <DropdownMenuRadioItem key={locale} value={locale}>
                        <span>{localeFlags[locale]}</span>
                        {locale.toUpperCase()}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <PasswordDialog
        defaultOpen={false}
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
      />
    </React.Fragment>
  );
}
