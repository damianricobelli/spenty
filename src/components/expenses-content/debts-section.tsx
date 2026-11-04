import { useRouter } from "@tanstack/react-router";
import { ArrowRightIcon, CheckCircle2Icon, Loader2Icon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { deleteExpense } from "@/api/expenses";
import type { SplitDebt } from "@/api/splits";
import { AnimatedCurrency } from "@/components/animated-currency";
import { Button } from "@/components/ui/button";
import { useAddExpenseEntry } from "@/hooks/expenses/use-add-expense-entry";
import { getAvatarColorClasses } from "@/lib/avatar-colors";
import { SETTLEMENT_CATEGORY } from "@/lib/categories";
import { cn } from "@/lib/cn";
import { dateToLocalISOString } from "@/lib/format-date";
import { getErrorMessage } from "@/lib/get-error-message";
import { listItem, reducedFade, springGentle } from "@/lib/motion";
import { m } from "@/paraglide/messages";

function MemberBadge({ name }: { name: string }) {
	const initial = name.trim().charAt(0).toUpperCase() || "?";
	return (
		<span className="inline-flex min-w-0 items-center gap-1.5 align-middle">
			<span
				className={cn(
					"flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
					getAvatarColorClasses(name),
				)}
			>
				{initial}
			</span>
			<span className="truncate">{name}</span>
		</span>
	);
}

/**
 * Who owes whom in a split group. Settling records the payment as a regular
 * entry (so balances stay derived from history) and offers Undo instead of a
 * confirmation step.
 */
export function DebtsSection({
	groupId,
	debts,
}: {
	groupId: string;
	debts: SplitDebt[];
}) {
	const router = useRouter();
	const reduceMotion = useReducedMotion();
	const settle = useAddExpenseEntry();
	const settlingKey = settle.isPending
		? `${settle.variables?.memberId}-${settle.variables?.paidToMemberIds?.[0]}`
		: null;

	const handleSettle = (debt: SplitDebt) => {
		settle.mutate(
			{
				groupId,
				memberId: debt.fromMemberId,
				paidToMemberIds: [debt.toMemberId],
				amount: debt.amount,
				category: SETTLEMENT_CATEGORY,
				description: "",
				paymentDate: dateToLocalISOString(new Date()),
			},
			{
				onSuccess: async (created) => {
					await router.invalidate();
					toast.success(
						m.debts_settled_toast({ from: debt.fromName, to: debt.toName }),
						{
							action: created
								? {
										label: m.common_undo(),
										onClick: async () => {
											await deleteExpense({
												data: { groupId, expenseId: created.id },
											});
											router.invalidate();
										},
									}
								: undefined,
						},
					);
				},
				onError: (error) => toast.error(getErrorMessage(error)),
			},
		);
	};

	return (
		<section>
			<h2 className="mb-3 text-md font-medium text-muted-foreground">
				{m.content_section_who_owes()}
			</h2>
			{debts.length === 0 ? (
				<div className="animate-in fade-in flex items-center gap-2 rounded-2xl border border-border/50 px-4 py-3 text-sm font-medium text-success duration-300">
					<CheckCircle2Icon className="size-4" />
					{m.debts_all_settled()}
				</div>
			) : (
				<ul className="divide-y divide-border/50 overflow-hidden rounded-2xl border border-border/50 shadow-sm">
					<AnimatePresence initial={false}>
						{debts.map((debt) => {
							const key = `${debt.fromMemberId}-${debt.toMemberId}`;
							const isSettling = settlingKey === key;
							return (
								<motion.li
									key={key}
									layout={reduceMotion ? false : "position"}
									initial={reduceMotion ? { opacity: 0 } : listItem.initial}
									animate={listItem.animate}
									exit={reduceMotion ? { opacity: 0 } : listItem.exit}
									transition={reduceMotion ? reducedFade : springGentle}
									className="flex items-center gap-3 bg-background py-2.5 pl-4 pr-2.5"
								>
									<p className="flex min-w-0 flex-1 items-center text-sm font-medium text-foreground">
										<MemberBadge name={debt.fromName} />
										<ArrowRightIcon
											className="mx-1.5 size-3.5 shrink-0 text-muted-foreground"
											aria-hidden
										/>
										<MemberBadge name={debt.toName} />
									</p>
									<span className="shrink-0 text-sm font-semibold tabular-nums tracking-tight">
										<AnimatedCurrency value={debt.amount} />
									</span>
									<Button
										variant="secondary"
										size="sm"
										disabled={settle.isPending}
										onClick={() => handleSettle(debt)}
										className="shrink-0"
									>
										{isSettling ? (
											<Loader2Icon className="animate-spin" />
										) : null}
										{m.debts_settle()}
									</Button>
								</motion.li>
							);
						})}
					</AnimatePresence>
				</ul>
			)}
		</section>
	);
}
