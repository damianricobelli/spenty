import { useRouter } from "@tanstack/react-router";
import { ArrowRightIcon, PencilIcon, Trash2Icon, UserIcon } from "lucide-react";
import { useState } from "react";
import { deleteExpense } from "@/api/expenses";
import { deleteMember } from "@/api/members";
import type { SplitDebt } from "@/api/splits";
import { useExpensesDrawerActions } from "@/components/expenses-drawer";
import type { ExpensesDrawerMember } from "@/components/expenses-drawer/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/format-currency";
import { m } from "@/paraglide/messages";
import { ButtonWithSpinner } from "../button-with-spinner";

type ExpenseItem = {
  id: string;
  amount: number;
  category: string;
  description: string;
  paid_by: string;
  created_at: string | null;
};

type ExpensesContentProps = {
  groupId: string;
  members: ExpensesDrawerMember[];
  expense: ExpenseItem[];
  routeType: "expenses" | "splits";
  debts?: SplitDebt[];
};

export function ExpensesContent({
  groupId,
  members,
  expense,
  routeType,
  debts = [],
}: ExpensesContentProps) {
  const router = useRouter();
  const drawerActions = useExpensesDrawerActions();
  const [deleteMemberId, setDeleteMemberId] = useState<string | null>(null);
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);
  const [isDeletingMember, setIsDeletingMember] = useState(false);
  const [isDeletingExpense, setIsDeletingExpense] = useState(false);

  const total = expense.reduce((sum, e) => sum + e.amount, 0);
  const memberById = new Map(members.map((m) => [m.id, m.name]));

  const categoryLabels: Record<string, string> = {
    food: m.category_food(),
    transport: m.category_transport(),
    housing: m.category_housing(),
    health: m.category_health(),
    entertainment: m.category_entertainment(),
    shopping: m.category_shopping(),
    subscriptions: m.category_subscriptions(),
    other: m.category_other(),
  };
  const getCategoryLabel = (category: string) =>
    categoryLabels[category] ?? category;

  const handleConfirmDeleteMember = async () => {
    if (!deleteMemberId) return;
    setIsDeletingMember(true);
    try {
      await deleteMember({ data: { groupId, memberId: deleteMemberId } });
      setDeleteMemberId(null);
      router.invalidate();
    } finally {
      setIsDeletingMember(false);
    }
  };

  const handleConfirmDeleteExpense = async () => {
    if (!deleteExpenseId) return;
    setIsDeletingExpense(true);
    try {
      await deleteExpense({ data: { groupId, expenseId: deleteExpenseId } });
      setDeleteExpenseId(null);
      router.invalidate();
    } finally {
      setIsDeletingExpense(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-6">
      {/* Members */}
      <section>
        <h2 className="mb-3 text-md font-medium text-muted-foreground">
          {m.content_section_members()}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {members.map((member) => (
            <span
              key={member.id}
              className="bg-muted-foreground/10 text-foreground flex h-9 w-fit items-center justify-center gap-1.5 rounded-4xl pl-3 pr-1 text-sm font-medium whitespace-nowrap"
            >
              {member.name}
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="-ml-0.5 shrink-0 opacity-50 hover:opacity-100 hover:text-destructive"
                aria-label={m.content_delete()}
                onClick={() => setDeleteMemberId(member.id)}
              >
                <Trash2Icon className="size-4" />
              </Button>
            </span>
          ))}
        </div>
      </section>

      {/* Total */}
      <section>
        <h2 className="mb-3 text-md font-medium text-muted-foreground">
          {m.content_section_total()}
        </h2>
        <p className="text-2xl font-semibold tracking-tight">
          {formatCurrency(total)}
        </p>
      </section>

      {/* Who owes whom (splits only) */}
      {routeType === "splits" && debts.length > 0 && (
        <section>
          <h2 className="mb-3 text-md font-medium text-muted-foreground">
            {m.content_section_who_owes()}
          </h2>
          <ul className="flex flex-col gap-4">
            {debts.map((d, i) => (
              <li
                key={`${d.fromMemberId}-${d.toMemberId}-${i}`}
                className="flex items-stretch gap-0 overflow-hidden rounded-2xl border border-border/50 bg-card/50 shadow-sm"
              >
                {/* From (debtor) card */}
                <div className="flex min-w-0 flex-1 items-center gap-3 border-r border-border/40 bg-muted/30 px-4 py-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-foreground/10 text-foreground">
                    <UserIcon className="size-5" />
                  </div>
                  <span className="truncate text-sm font-semibold" title={d.fromName}>
                    {d.fromName}
                  </span>
                </div>
                {/* Arrow + amount */}
                <div className="flex shrink-0 flex-col items-center justify-center gap-1 border-x border-border/40 bg-muted/20 px-4 py-3">
                  <ArrowRightIcon className="size-5 text-muted-foreground" aria-hidden />
                  <span className="text-sm font-semibold tabular-nums">
                    {formatCurrency(d.amount)}
                  </span>
                </div>
                {/* To (creditor) card */}
                <div className="flex min-w-0 flex-1 items-center gap-3 bg-muted/30 px-4 py-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-foreground/10 text-foreground">
                    <UserIcon className="size-5" />
                  </div>
                  <span className="truncate text-sm font-semibold" title={d.toName}>
                    {d.toName}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* History */}
      <section className="flex min-h-0 flex-1 flex-col">
        <h2 className="mb-3 text-md font-medium text-muted-foreground">
          {m.content_section_history()}
        </h2>
        {expense.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {m.empty_no_expenses()}
          </p>
        ) : (
          <ul className="divide-y divide-border/60 rounded-lg border border-border/60 overflow-auto">
            {expense.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between gap-2 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-md font-medium">{formatCurrency(e.amount)}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {[e.category ? getCategoryLabel(e.category) : null, e.description]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {memberById.get(e.paid_by) ?? "—"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  {drawerActions && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-foreground"
                      aria-label={m.content_edit()}
                      onClick={() => drawerActions.openEditExpense(e.id)}
                    >
                      <PencilIcon />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={m.content_delete()}
                    onClick={() => setDeleteExpenseId(e.id)}
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Delete member dialog */}
      <Dialog open={!!deleteMemberId} onOpenChange={(open) => !open && setDeleteMemberId(null)}>
        <DialogContent showCloseButton={true}>
          <DialogHeader>
            <DialogTitle>{m.content_delete_member_title()}</DialogTitle>
            <DialogDescription>
              {m.content_delete_member_description()}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton={false}>
            <Button
              variant="ghost"
              onClick={() => setDeleteMemberId(null)}
              disabled={isDeletingMember}
            >
              {m.content_cancel()}
            </Button>
            <ButtonWithSpinner
              type="button"
              isPending={isDeletingMember}
              text={m.content_delete()}
              onClick={handleConfirmDeleteMember}
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete expense dialog */}
      <Dialog open={!!deleteExpenseId} onOpenChange={(open) => !open && setDeleteExpenseId(null)}>
        <DialogContent showCloseButton={true}>
          <DialogHeader>
            <DialogTitle>{m.content_delete_expense_title()}</DialogTitle>
            <DialogDescription>
              {m.content_delete_expense_description()}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton={false}>
            <Button
              variant="ghost"
              onClick={() => setDeleteExpenseId(null)}
              disabled={isDeletingExpense}
            >
              {m.content_cancel()}
            </Button>
            <ButtonWithSpinner
              type="button"
              isPending={isDeletingExpense}
              text={m.content_delete()}
              onClick={handleConfirmDeleteExpense}
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
