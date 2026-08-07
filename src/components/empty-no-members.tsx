import { useLoaderData, useRouter } from "@tanstack/react-router";
import {
  CheckIcon,
  PencilIcon,
  ReceiptIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { type ReactNode, useState } from "react";
import { useExpensesToolbarActions } from "@/components/expenses-toolbar/toolbar-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUpdateGroupName } from "@/hooks/groups/use-update-name";
import { useEntity } from "@/hooks/use-entity";
import { cn } from "@/lib/cn";
import { isDefaultGroupName } from "@/lib/group-name";
import { springGentle } from "@/lib/motion";
import { m } from "@/paraglide/messages";
import { toast } from "sonner";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "./ui/empty";

function GuideStep({
  index,
  icon,
  active,
  done,
  children,
}: {
  index: number;
  icon: ReactNode;
  active?: boolean;
  done?: boolean;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.li
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springGentle, delay: index * 0.08 }}
      className={cn(
        "flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm",
        active
          ? "border-primary/30 bg-primary/5 text-foreground"
          : "border-border/50 text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
          done
            ? "bg-success/15 text-success"
            : active
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground",
        )}
      >
        {done ? <CheckIcon className="size-4" /> : index + 1}
      </span>
      <div className="min-w-0 flex-1 font-medium">{children}</div>
      <span className="shrink-0 text-muted-foreground/60 [&_svg]:size-4">
        {icon}
      </span>
    </motion.li>
  );
}

export function EmptyNoMembers() {
  const actions = useExpensesToolbarActions();
  const entity = useEntity();
  const { group } = useLoaderData({ from: entity });
  const router = useRouter();
  const updateName = useUpdateGroupName();

  const isNamed = !isDefaultGroupName(group.name);
  const [name, setName] = useState(isNamed ? group.name : "");

  const saveName = () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === group.name.trim()) return;
    updateName.mutate(
      { name: trimmed, groupId: group.id },
      {
        onSuccess: () => {
          toast.success(m.header_name_saved());
          router.invalidate();
        },
      },
    );
  };

  return (
    <div className="flex min-h-[calc(100dvh-var(--header-offset))] flex-col items-center justify-center px-4">
      <Empty className="w-full max-w-sm">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <UsersIcon />
          </EmptyMedia>
          <EmptyTitle>{m.empty_no_members_title()}</EmptyTitle>
          <EmptyDescription>
            {m.empty_no_members_description()}
          </EmptyDescription>
        </EmptyHeader>
        <div className="flex w-full flex-col gap-4">
          <ul className="flex w-full flex-col gap-2">
            <GuideStep
              index={0}
              icon={<PencilIcon />}
              active={!isNamed}
              done={isNamed}
            >
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={saveName}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
                placeholder={m.guide_step_name()}
                disabled={updateName.isPending}
                autoFocus={!isNamed}
                className="h-8 border-transparent bg-transparent px-2 text-sm font-medium not-focus-within:hover:border-border/60"
              />
            </GuideStep>
            <GuideStep index={1} icon={<UserPlusIcon />} active={isNamed}>
              {m.guide_step_members()}
            </GuideStep>
            <GuideStep index={2} icon={<ReceiptIcon />}>
              {m.guide_step_expense()}
            </GuideStep>
          </ul>
          {actions && (
            <Button
              size="lg"
              className="mx-auto"
              onClick={actions.openAddMember}
              aria-label={m.toolbar_button_add_member()}
            >
              <UserPlusIcon data-icon="inline-start" />
              {m.toolbar_button_add_member()}
            </Button>
          )}
        </div>
      </Empty>
    </div>
  );
}
