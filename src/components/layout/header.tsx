import { Link, useLoaderData, useRouter } from "@tanstack/react-router";
import {
  ArrowLeftIcon,
  GlobeIcon,
  LockIcon,
  MonitorIcon,
  MoonIcon,
  PencilIcon,
  SettingsIcon,
  ShareIcon,
  SunIcon,
  Trash2Icon,
  UnlockIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import React, { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { DeleteGroupDialog } from "@/components/delete-group-dialog";
import { PasswordDialog } from "@/components/password-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
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
  const { theme, setTheme } = useTheme();

  const updateName = useUpdateGroupName();

  const isUnnamed = !group.name.trim();
  const [groupName, setGroupName] = useState(isUnnamed ? "" : group.name);

  // Keep the title in sync when the name changes elsewhere (e.g. renamed
  // from the guided empty state), without clobbering an in-progress edit.
  const nameInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (document.activeElement === nameInputRef.current) return;
    setGroupName(group.name.trim() ? group.name : "");
  }, [group.name]);

  const [_, startTransition] = useTransition();

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [deleteGroupDialogOpen, setDeleteGroupDialogOpen] = useState(false);

  const handleUpdateGroupName = async () => {
    if (!groupName.trim()) {
      setGroupName(group.name);
      return;
    }
    if (groupName.trim() === group.name.trim()) return;
    setGroupName(groupName);
    startTransition(() => {
      updateName.mutate(
        { name: groupName, groupId: group.id },
        { onSuccess: () => toast.success(m.header_name_saved()) },
      );
      router.invalidate();
    });
  };

  const copyShareLink = () => {
    try {
      const sharePath = from.replace("$id", group.slug);
      const shareUrl = new URL(sharePath, window.location.origin).toString();
      navigator.clipboard.writeText(shareUrl);
      toast.success(m.header_copy_code_toast());
    } catch (error) {
      console.error("Failed to copy link:", error);
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
      <header className="sticky top-0 z-20 h-(--header-offset) flex items-center border-b border-border/60 bg-background/95 px-4 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3">
          <Link
            to="/"
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={m.header_back_aria_label()}
          >
            <ArrowLeftIcon className="size-5" />
          </Link>

          <div className="min-w-0 flex-1 flex flex-col items-center justify-center py-0.5">
            <div className="group/name relative flex h-8 items-center">
              <Input
                ref={nameInputRef}
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                onBlur={handleUpdateGroupName}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
                placeholder={m.header_group_name_placeholder()}
                className="w-64 border-transparent bg-transparent text-center font-semibold text-foreground transition-colors not-focus-within:hover:border-border/60 pr-8"
                aria-invalid={
                  !!updateName.error || groupName.trim().length === 0
                }
              />
              <PencilIcon
                aria-hidden
                className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/50 transition-opacity group-focus-within/name:opacity-0"
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
                  copyShareLink();
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
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  {theme === "dark" ? (
                    <MoonIcon />
                  ) : theme === "light" ? (
                    <SunIcon />
                  ) : (
                    <MonitorIcon />
                  )}
                  {m.header_theme()}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup
                    value={theme ?? "system"}
                    onValueChange={(v) => setTheme(v)}
                  >
                    <DropdownMenuRadioItem value="light">
                      <SunIcon />
                      {m.theme_light()}
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="dark">
                      <MoonIcon />
                      {m.theme_dark()}
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="system">
                      <MonitorIcon />
                      {m.theme_system()}
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={(e) => {
                  e.preventDefault();
                  setDeleteGroupDialogOpen(true);
                }}
              >
                <Trash2Icon />
                {m.header_delete_group()}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <PasswordDialog
        defaultOpen={false}
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
      />
      <DeleteGroupDialog
        open={deleteGroupDialogOpen}
        onOpenChange={setDeleteGroupDialogOpen}
      />
    </React.Fragment>
  );
}
