import {
	useLoaderData,
	useMatchRoute,
	useRouter,
} from "@tanstack/react-router";
import { XIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useLayoutEffect, useState } from "react";
import useMeasure from "react-use-measure";
import { toast } from "sonner";
import { Drawer } from "vaul";
import { AddExpenseEntrySchema, AddMemberSchema } from "@/api/schema";
import { Button } from "@/components/ui/button";
import { useAddExpenseEntry } from "@/hooks/expenses/use-add-expense-entry";
import { useAddMember } from "@/hooks/members/use-add-member";
import { useEntity } from "@/hooks/use-entity";
import { cn } from "@/lib/cn";
import { getErrorMessage } from "@/lib/get-error-message";
import { m } from "@/paraglide/messages";
import { DrawerAddExpenseForm } from "./drawer-add-expense-form";
import { DrawerAddMemberForm } from "./drawer-add-member-form";
import { DrawerDefaultView } from "./drawer-default-view";
import { DrawerSettingsView } from "./drawer-settings-view";
import { EXPENSES_DRAWER_VIEW, type ExpensesDrawerView } from "./types";

/**
 * Bypass focus-trap when using Select inside Drawer/Dialog.
 * @see https://github.com/emilkowalski/vaul/issues/497#issuecomment-2452503724
 */
function useDrawerFocusBypass() {
	useLayoutEffect(() => {
		const controller = new AbortController();
		const signal = controller.signal;
		function handleFocus(e: FocusEvent) {
			e.stopImmediatePropagation();
		}
		document.addEventListener("focusin", handleFocus, { signal });
		document.addEventListener("focusout", handleFocus, { signal });
		return () => controller.abort();
	}, []);
}

export function ExpensesDrawer() {
	const from = useEntity();

	const { group, members } = useLoaderData({
		from,
	});

	const router = useRouter();
	const addMemberMutation = useAddMember();
	const addExpenseMutation = useAddExpenseEntry();

	const [view, setView] = useState<ExpensesDrawerView>(
		EXPENSES_DRAWER_VIEW.DEFAULT,
	);
	const [expenseMemberId, setExpenseMemberId] = useState("");
	const [elementRef, bounds] = useMeasure();

	useDrawerFocusBypass();

	const handleAddMember = (e: React.SyntheticEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const memberName = formData.get("name");

		const result = AddMemberSchema.safeParse({
			name: memberName,
			groupId: group.id,
		});
		if (!result.success) {
			console.error("Invalid name:", result.error);
			return;
		}

		addMemberMutation.mutate(
			{ groupId: group.id, name: result.data.name.trim() },
			{
				onSuccess: () => {
					toast.success(m.drawer_member_added_toast());
					router.invalidate();
				},
				onError: (err) => toast.error(getErrorMessage(err)),
			},
		);
	};

	const handleAddExpense = (e: React.SyntheticEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const amountRaw = formData.get("amount");
		const amount =
			typeof amountRaw === "string"
				? Number.parseFloat(amountRaw.replace(",", "."))
				: NaN;

		const result = AddExpenseEntrySchema.safeParse({
			groupId: group.id,
			memberId: formData.get("memberId"),
			amount,
			category: formData.get("category") || undefined,
			description: formData.get("description") || undefined,
		});
		if (!result.success) {
			console.error("Invalid expense:", result.error);
			return;
		}

		addExpenseMutation.mutate(result.data, {
			onSuccess: () => {
				toast.success(m.drawer_expense_added_toast());
				router.invalidate();
			},
			onError: (err) => toast.error(getErrorMessage(err)),
		});
	};

	const content = (view: ExpensesDrawerView) => {
		switch (view) {
			case "default":
				return <DrawerDefaultView members={members} onViewChange={setView} />;
			case "add_expense":
				return (
					<DrawerAddExpenseForm
						members={members}
						memberId={expenseMemberId}
						onMemberIdChange={setExpenseMemberId}
						onSubmit={handleAddExpense}
					/>
				);
			case "add_member":
				return <DrawerAddMemberForm />;
			case "settings":
				return <DrawerSettingsView />;
		}
	};

	return (
		<Drawer.Root open modal={false} dismissible={false}>
			<Drawer.Portal>
				<Drawer.Overlay />
				<Drawer.Content
					asChild
					onInteractOutside={() => setView("default")}
					onEscapeKeyDown={() => setView("default")}
					className={cn(
						"fixed inset-x-4 bottom-4 z-10 border border-border/50 bg-background shadow-lg backdrop-blur-xl mx-auto overflow-hidden rounded-[36px] outline-hidden md:mx-auto md:w-full",
						view === "default" ? "max-w-fit" : "max-w-full md:max-w-md",
					)}
				>
					<motion.div
						animate={{
							height: bounds.height,
							transition: {
								duration: 0.27,
								ease: [0.25, 1, 0.5, 1],
							},
						}}
					>
						<Drawer.Title className="sr-only">
							{view === "add_expense"
								? m.drawer_title_add_expense()
								: m.drawer_title_add_member()}
						</Drawer.Title>
						<Drawer.Description className="sr-only">
							{view === "add_expense"
								? m.drawer_description_add_expense()
								: m.drawer_description_add_member()}
						</Drawer.Description>
						{view !== "default" && (
							<Drawer.Close asChild>
								<Button
									type="button"
									variant="ghost"
									size="icon-xs"
									onClick={() => setView("default")}
									className="absolute right-4 top-4 z-10 flex items-center justify-center transition-transform focus:scale-95 active:scale-75"
								>
									<XIcon />
								</Button>
							</Drawer.Close>
						)}
						<div ref={elementRef} className="p-2 antialiased">
							<AnimatePresence initial={false} mode="popLayout" custom={view}>
								<motion.div
									initial={{ opacity: 0, scale: 0.96 }}
									animate={{ opacity: 1, scale: 1, y: 0 }}
									exit={{ opacity: 0, scale: 0.96 }}
									key={view}
									transition={{
										duration: 0.27,
										ease: [0.26, 0.08, 0.25, 1],
									}}
								>
									{content(view)}
								</motion.div>
							</AnimatePresence>
						</div>
					</motion.div>
				</Drawer.Content>
			</Drawer.Portal>
		</Drawer.Root>
	);
}
