import { useRouter } from "@tanstack/react-router";
import { ArrowRightIcon, PencilIcon, Trash2Icon, UserIcon } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { deleteExpense } from "@/api/expenses";
import { deleteMember } from "@/api/members";
import type { DeleteExpense, DeleteMember } from "@/api/schema";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppMutation } from "@/hooks/use-app-mutation";
import { formatCurrency } from "@/lib/format-currency";
import { formatDate } from "@/lib/format-date";
import { m } from "@/paraglide/messages";
import { getLocale } from "@/paraglide/runtime";
import { ButtonWithSpinner } from "../button-with-spinner";

function getMonthKey(date: Date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  return `${y}-${String(m).padStart(2, "0")}`;
}

function useExpenseTotals(expense: ExpenseItem[]) {
  return useMemo(() => {
    const now = new Date();
    const thisMonthKey = getMonthKey(now);
    let totalAll = 0;
    let totalThisMonth = 0;
    const totalByMonth = new Map<string, number>();
    const monthKeys = new Set<string>([thisMonthKey]);

    for (const e of expense) {
      totalAll += e.amount;
      const key = e.expense_date ? e.expense_date.slice(0, 7) : null;
      if (key) monthKeys.add(key);
      if (key === thisMonthKey) totalThisMonth += e.amount;
      if (key) totalByMonth.set(key, (totalByMonth.get(key) ?? 0) + e.amount);
    }

    const sortedMonths = Array.from(monthKeys).sort().reverse();
    return {
      totalAll,
      totalThisMonth,
      totalByMonth,
      sortedMonths,
    };
  }, [expense]);
}

type ExpenseItem = {
  id: string;
  amount: number;
  category: string;
  description: string;
  paid_by: string;
  created_at: string | null;
  expense_date: string | null;
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
  const deleteMemberIdRef = useRef<string>(null);
  const deleteExpenseIdRef = useRef<string>(null);

  const [isDeleteMemberDialogOpen, setIsDeleteMemberDialogOpen] = useState(false);
  const [isDeleteExpenseDialogOpen, setIsDeleteExpenseDialogOpen] = useState(false);

  const deleteMemberMutation = useAppMutation({
    mutationFn: (data: DeleteMember) => deleteMember({ data }),
    invalidateKeys: ["members", groupId],
    onSuccess: () => {
      deleteMemberIdRef.current = null;
      setIsDeleteMemberDialogOpen(false);
      router.invalidate();
    },
  });
  
  const deleteExpenseMutation = useAppMutation({
    mutationFn: (data: DeleteExpense) => deleteExpense({ data }),
    invalidateKeys: ["expenses", groupId],
    onSuccess: () => {
      deleteExpenseIdRef.current = null;
      setIsDeleteExpenseDialogOpen(false);
      router.invalidate();
    },
  });

  const { totalAll, totalThisMonth, totalByMonth, sortedMonths } =
    useExpenseTotals(expense);
  const [compareMonthKey, setCompareMonthKey] = useState<string | null>(null);
  const memberById = new Map(members.map((m) => [m.id, m.name]));

  const compareMonthTotal = compareMonthKey
    ? totalByMonth.get(compareMonthKey) ?? 0
    : 0;
  const compareLabel =
    compareMonthKey &&
    (() => {
      const [y, m] = compareMonthKey.split("-").map(Number);
      return formatDate(new Date(y, m - 1, 1), "MMMM yyyy");
    })();
  const diffPctValue =
    compareMonthTotal > 0
      ? ((totalThisMonth - compareMonthTotal) / compareMonthTotal) * 100
      : totalThisMonth > 0
        ? 100
        : 0;
  const formattedPct = Math.abs(diffPctValue).toLocaleString(getLocale(), {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });

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

  const handleConfirmDeleteMember = () => {
    const memberId = deleteMemberIdRef.current;
    if (!memberId) return;
    deleteMemberMutation.mutate(
      { groupId, memberId },
      {
        onSuccess: () => {
          deleteMemberIdRef.current = null;
          setIsDeleteMemberDialogOpen(false);
          router.invalidate();
        },
      },
    );
  };

  const handleConfirmDeleteExpense = () => {
    const expenseId = deleteExpenseIdRef.current;
    if (!expenseId) return;
    deleteExpenseMutation.mutate(
      { groupId, expenseId },
      {
        onSuccess: () => {
          deleteExpenseIdRef.current = null;
          setIsDeleteExpenseDialogOpen(false);
          router.invalidate();
        },
      },
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-6">
      {/* Members */}
      <section>
        <h2 className="mb-3 text-md font-medium text-muted-foreground">
          {m.content_section_members()}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {members.map((member) => {
            const initial = member.name.trim().charAt(0).toUpperCase() || "?";
            return (
              <span
                key={member.id}
                className="bg-muted text-foreground border-border/60 group flex h-9 w-fit items-center gap-2 rounded-full border pl-1.5 pr-1 text-sm font-medium shadow-sm transition-shadow hover:shadow-md whitespace-nowrap"
              >
                <span className="bg-muted-foreground/15 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-foreground">
                  {initial}
                </span>
                <span className="pr-0.5">{member.name}</span>
                {drawerActions && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="shrink-0 rounded-full opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10"
                    aria-label={m.content_edit()}
                    onClick={() => drawerActions.openEditMember(member.id)}
                  >
                    <PencilIcon className="size-3.5" />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="shrink-0 rounded-full opacity-60 hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                  aria-label={m.content_delete()}
                  onClick={() => {
                    deleteMemberIdRef.current = member.id;
                    setIsDeleteMemberDialogOpen(true);
                  }}
                >
                  <Trash2Icon className="size-3.5" />
                </Button>
              </span>
            );
          })}
        </div>
      </section>

      {/* Total */}
      <section>
        <h2 className="mb-3 text-md font-medium text-muted-foreground">
          {m.content_section_total()}
        </h2>
        <div className="overflow-hidden rounded-2xl border border-border/50 shadow-sm">
          <div className="grid grid-cols-1 divide-y divide-border/50 sm:grid-cols-2 sm:divide-y-0 sm:divide-x">
            <div className="min-w-0 overflow-hidden px-4 py-4">
              <p className="text-muted-foreground truncate text-xs font-medium uppercase tracking-wider">
                {m.content_total_this_month()}
              </p>
              <p className="mt-1 truncate text-lg font-semibold tabular-nums tracking-tight sm:text-2xl">
                {formatCurrency(totalThisMonth)}
              </p>
            </div>
            <div className="min-w-0 overflow-hidden px-4 py-4">
              <p className="text-muted-foreground truncate text-xs font-medium uppercase tracking-wider">
                {m.content_total_all()}
              </p>
              <p className="mt-1 truncate text-lg font-semibold tabular-nums tracking-tight sm:text-2xl">
                {formatCurrency(totalAll)}
              </p>
            </div>
          </div>
          {sortedMonths.length > 1 && (
            <div className="border-t border-border/50 px-4 py-3">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                  <span className="text-muted-foreground shrink-0 text-sm">
                    {m.content_compare_with()}
                  </span>
                  <Select
                    value={compareMonthKey ?? ""}
                    onValueChange={(v) => setCompareMonthKey(v || null)}
                  >
                    <SelectTrigger
                      size="sm"
                      className="h-8 w-full min-w-0"
                    >
                      <SelectValue placeholder={m.content_compare_placeholder()} />
                    </SelectTrigger>
                    <SelectContent align="start">
                      {sortedMonths
                        .filter((k) => k !== getMonthKey(new Date()))
                        .map((key) => {
                          const [y, m] = key.split("-").map(Number);
                          const label = formatDate(
                            new Date(y, m - 1, 1),
                            "MMMM yyyy",
                          );
                          return (
                            <SelectItem key={key} value={key}>
                              {label} ({formatCurrency(totalByMonth.get(key) ?? 0)})
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                </div>
                {compareLabel != null && (
                  <p
                    className={
                      diffPctValue > 0
                        ? "text-destructive text-sm"
                        : diffPctValue < 0
                          ? "text-emerald-600 dark:text-emerald-400 text-sm"
                          : "text-muted-foreground text-sm"
                    }
                  >
                    {diffPctValue > 0
                      ? m.content_vs_month_more({
                          month: compareLabel,
                          pct: formattedPct,
                        })
                      : diffPctValue < 0
                        ? m.content_vs_month_less({
                            month: compareLabel,
                            pct: formattedPct,
                          })
                        : m.content_vs_month_same({ month: compareLabel })}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
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
                {/* From */}
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
                {/* To */}
                <div className="flex min-w-0 flex-1 items-center justify-end gap-3 bg-muted/30 px-4 py-3">
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
      <section className="flex min-h-0 flex-1 flex-col pb-24">
        <h2 className="mb-3 text-md font-medium text-muted-foreground">
          {m.content_section_history()}
        </h2>
        {expense.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {m.empty_no_expenses()}
          </p>
        ) : (
          <ul className="divide-y divide-border/50 rounded-2xl border border border-border/50 shadow-sm overflow-auto">
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
                    {e.expense_date
                      ? ` · ${formatDate(new Date(`${e.expense_date}T12:00:00`), "PPP")}`
                      : ""}
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
                    onClick={() => {
                    deleteExpenseIdRef.current = e.id;
                    setIsDeleteExpenseDialogOpen(true);
                  }}
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
      <Dialog
        open={isDeleteMemberDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            deleteMemberIdRef.current = null;
            setIsDeleteMemberDialogOpen(false);
          }
        }}
      >
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
              onClick={() => setIsDeleteMemberDialogOpen(false)}
              disabled={deleteMemberMutation.isPending}
            >
              {m.content_cancel()}
            </Button>
            <ButtonWithSpinner
              type="button"
              isPending={deleteMemberMutation.isPending}
              text={m.content_delete()}
              onClick={handleConfirmDeleteMember}
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete expense dialog */}
      <Dialog
        open={isDeleteExpenseDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            deleteExpenseIdRef.current = null;
            setIsDeleteExpenseDialogOpen(false);
          }
        }}
      >
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
              onClick={() => setIsDeleteExpenseDialogOpen(false)}
              disabled={deleteExpenseMutation.isPending}
            >
              {m.content_cancel()}
            </Button>
            <ButtonWithSpinner
              type="button"
              isPending={deleteExpenseMutation.isPending}
              text={m.content_delete()}
              onClick={handleConfirmDeleteExpense}
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
