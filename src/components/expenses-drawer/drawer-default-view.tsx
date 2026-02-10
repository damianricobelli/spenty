import { DollarSignIcon, UserPlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { m } from "@/paraglide/messages";
import type { ExpensesDrawerMember, ExpensesDrawerView } from "./types";

type DrawerDefaultViewProps = {
  members: ExpensesDrawerMember[];
  onViewChange: (view: ExpensesDrawerView) => void;
};

export function DrawerDefaultView({
  members,
  onViewChange,
}: DrawerDefaultViewProps) {
  return (
    <div className="flex items-center justify-center py-2 px-3">
      <div className="flex min-w-0 items-center justify-center gap-2 sm:gap-3">
        <Button
          disabled={members.length === 0}
          size="lg"
          onClick={() => onViewChange("add_expense")}
          aria-label={m.drawer_button_add_expense()}
        >
          <DollarSignIcon data-icon="inline-start" />
          {m.drawer_button_add_expense()}
        </Button>

        <Button
          variant="ghost"
          size="lg"
          onClick={() => onViewChange("add_member")}
          aria-label={m.drawer_button_add_member()}
          className="bg-muted"
        >
          <UserPlusIcon data-icon="inline-start" />
          {m.drawer_button_add_member()}
        </Button>
      </div>
    </div>
  );
}
