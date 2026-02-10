import { UserPlusIcon, UsersIcon } from "lucide-react";
import { m } from "@/paraglide/messages";
import { Button } from "@/components/ui/button";
import { useExpensesDrawerActions } from "@/components/expenses-drawer/expenses-drawer-context";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "./empty";

export function EmptyNoMembers() {
  const actions = useExpensesDrawerActions();

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <UsersIcon />
        </EmptyMedia>
        <EmptyTitle>{m.empty_no_members_title()}</EmptyTitle>
        <EmptyDescription>{m.empty_no_members_description()}</EmptyDescription>
      </EmptyHeader>
      {actions && (
        <EmptyContent>
          <Button
            size="lg"
            onClick={actions.openAddMember}
            aria-label={m.drawer_button_add_member()}
          >
            <UserPlusIcon data-icon="inline-start" />
            {m.drawer_button_add_member()}
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
}
