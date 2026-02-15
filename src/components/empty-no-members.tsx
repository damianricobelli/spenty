import { UserPlusIcon, UsersIcon } from "lucide-react";
import { useExpensesToolbarActions } from "@/components/expenses-toolbar/toolbar-context";
import { Button } from "@/components/ui/button";
import { m } from "@/paraglide/messages";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "./ui/empty";

export function EmptyNoMembers() {
  const actions = useExpensesToolbarActions();

  return (
    <div className="flex min-h-[calc(100dvh-var(--header-offset))] flex-col items-center justify-center">
      <Empty className="w-full">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <UsersIcon />
          </EmptyMedia>
          <EmptyTitle>{m.empty_no_members_title()}</EmptyTitle>
          <EmptyDescription>
            {m.empty_no_members_description()}
          </EmptyDescription>
        </EmptyHeader>
        {actions && (
          <EmptyContent>
            <Button
              size="lg"
              onClick={actions.openAddMember}
              aria-label={m.toolbar_button_add_member()}
            >
              <UserPlusIcon data-icon="inline-start" />
              {m.toolbar_button_add_member()}
            </Button>
          </EmptyContent>
        )}
      </Empty>
    </div>
  );
}
