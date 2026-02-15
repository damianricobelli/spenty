import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { useLoaderData } from "@tanstack/react-router";
import { DollarSignIcon, UserPlusIcon, XIcon } from "lucide-react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { type ReactNode, useLayoutEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Toolbar, ToolbarButton } from "@/components/ui/toolbar";
import { useEntity } from "@/hooks/use-entity";
import { m } from "@/paraglide/messages";
import { ToolbarExpenseForm } from "./expense-form";
import { ToolbarMemberForm } from "./member-form";
import { EXPENSES_TOOLBAR_VIEW, type ExpensesToolbarView } from "./types";

type ExpensesToolbarProps = {
	view?: ExpensesToolbarView;
	onViewChange?: (view: ExpensesToolbarView) => void;
	editExpenseId?: string | null;
	editMemberId?: string | null;
};

/**
 * Bypass focus-trap when using Select/Combobox inside overlays.
 * @see https://github.com/emilkowalski/vaul/issues/497#issuecomment-2452503724
 */
function useOverlayFocusBypass() {
	useLayoutEffect(() => {
		const controller = new AbortController();
		const { signal } = controller;
		const handleFocus = (e: FocusEvent) => e.stopImmediatePropagation();

		document.addEventListener("focusin", handleFocus, { signal });
		document.addEventListener("focusout", handleFocus, { signal });
		return () => controller.abort();
	}, []);
}

const viewMetadata = {
	add_expense: {
		title: m.toolbar_title_add_expense(),
		description: m.toolbar_description_add_expense(),
	},
	edit_expense: {
		title: m.toolbar_title_edit_expense(),
		description: m.toolbar_description_add_expense(),
	},
	add_member: {
		title: m.toolbar_title_add_member(),
		description: m.toolbar_description_add_member(),
	},
	edit_member: {
		title: m.toolbar_title_edit_member(),
		description: m.toolbar_description_edit_member(),
	},
	default: { title: "", description: "" },
};

const shellTransition = { duration: 0.34, ease: [0.22, 1, 0.36, 1] } as const;
const contentTransition = {
	duration: 0.3,
	ease: [0.22, 1, 0.36, 1],
} as const;

export function ExpensesToolbar({
	view: controlledView,
	onViewChange,
	editExpenseId,
	editMemberId,
}: ExpensesToolbarProps = {}) {
	const from = useEntity();
	const { members } = useLoaderData({ from });
	const [internalView, setInternalView] = useState<ExpensesToolbarView>(
		EXPENSES_TOOLBAR_VIEW.DEFAULT,
	);

	const isControlled =
		controlledView !== undefined && onViewChange !== undefined;
	const view = isControlled ? controlledView : internalView;
	const setView = (isControlled ? onViewChange : setInternalView) as (
		v: ExpensesToolbarView,
	) => void;

	useOverlayFocusBypass();

	const hasMembers = members.length > 0;
	const isDefaultView = view === EXPENSES_TOOLBAR_VIEW.DEFAULT;
	const currentMetadata =
		viewMetadata[view as keyof typeof viewMetadata] || viewMetadata.default;

	const renderFormContent = () => {
		const reset = () => setView(EXPENSES_TOOLBAR_VIEW.DEFAULT);

		switch (view) {
			case "add_expense":
				return <ToolbarExpenseForm intent="add" resetToolbar={reset} />;

			case "edit_expense":
				if (!editExpenseId) return null;
				return (
					<ToolbarExpenseForm
						key={editExpenseId}
						intent="edit"
						expenseId={editExpenseId}
						resetToolbar={reset}
					/>
				);

			case "add_member":
				return <ToolbarMemberForm intent="add" resetToolbar={reset} />;

			case "edit_member":
				if (!editMemberId) return null;
				return (
					<ToolbarMemberForm
						key={editMemberId}
						intent="edit"
						memberId={editMemberId}
						resetToolbar={reset}
					/>
				);

			default:
				return null;
		}
	};

	const renderAnimatedContent = (content: ReactNode) => (
		<div className="px-3.5 pt-3.5 pb-3 antialiased">{content}</div>
	);

	if (!hasMembers) {
		return (
			<DialogPrimitive.Root
				open
				modal={true}
				onOpenChange={(open) => {
					if (!open) setView(EXPENSES_TOOLBAR_VIEW.DEFAULT);
				}}
			>
				<DialogPrimitive.Portal>
					<DialogPrimitive.Backdrop className="fixed inset-0 z-30 bg-black/80 backdrop-blur-xs" />
					<DialogPrimitive.Viewport className="fixed inset-0 isolate z-30 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4 sm:py-6">
						<div className="flex min-h-full w-full items-end justify-center">
							<DialogPrimitive.Popup className="relative w-full max-w-md overflow-hidden rounded-[36px] border border-border/50 bg-white shadow-lg outline-hidden">
								<DialogPrimitive.Title className="sr-only">
									{currentMetadata.title}
								</DialogPrimitive.Title>
								<DialogPrimitive.Description className="sr-only">
									{currentMetadata.description}
								</DialogPrimitive.Description>

								<DialogPrimitive.Close
									render={
										<Button
											type="button"
											variant="ghost"
											size="icon-xs"
											className="absolute right-4 top-4 z-10 flex items-center justify-center transition-transform focus:scale-95 active:scale-75"
										/>
									}
									onClick={() => setView(EXPENSES_TOOLBAR_VIEW.DEFAULT)}
								>
									<XIcon />
								</DialogPrimitive.Close>

								{renderAnimatedContent(
									<AnimatePresence initial={false} mode="popLayout">
										<motion.div
											key={view}
											initial={{ opacity: 0, scale: 0.985 }}
											animate={{ opacity: 1, scale: 1 }}
											exit={{ opacity: 0, scale: 0.985 }}
											transition={contentTransition}
										>
											{renderFormContent()}
										</motion.div>
									</AnimatePresence>,
								)}
							</DialogPrimitive.Popup>
						</div>
					</DialogPrimitive.Viewport>
				</DialogPrimitive.Portal>
			</DialogPrimitive.Root>
		);
	}

	return (
		<LayoutGroup id="expenses-toolbar-shell">
			<AnimatePresence initial={false} mode="popLayout">
				{isDefaultView ? (
					<motion.div
						key="toolbar"
						layoutId="expenses-toolbar-shell"
						initial={{ opacity: 0, scale: 1 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 1, y: 6 }}
						transition={shellTransition}
						className="fixed inset-x-4 bottom-4 z-20 mx-auto w-fit overflow-hidden rounded-[36px] border border-border/50 bg-white px-3.5 py-3 shadow-lg backdrop-blur-xl"
					>
						<Toolbar
							aria-label={m.toolbar_title_add_expense()}
							className="gap-1.5 sm:gap-2"
						>
							<ToolbarButton
								size="lg"
								onClick={() => setView(EXPENSES_TOOLBAR_VIEW.ADD_EXPENSE)}
								aria-label={m.toolbar_button_add_expense()}
							>
								<DollarSignIcon data-icon="inline-start" />
								{m.toolbar_button_add_expense()}
							</ToolbarButton>

							<ToolbarButton
								variant="ghost"
								size="lg"
								onClick={() => setView(EXPENSES_TOOLBAR_VIEW.ADD_MEMBER)}
								aria-label={m.toolbar_button_add_member()}
							>
								<UserPlusIcon data-icon="inline-start" />
								{m.toolbar_button_add_member()}
							</ToolbarButton>
						</Toolbar>
					</motion.div>
				) : (
					<DialogPrimitive.Root
						key="dialog"
						open
						modal={true}
						onOpenChange={(open) => {
							if (!open) setView(EXPENSES_TOOLBAR_VIEW.DEFAULT);
						}}
					>
						<DialogPrimitive.Portal>
							<DialogPrimitive.Viewport className="fixed inset-0 isolate z-30 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4 sm:py-6">
								<div className="flex min-h-full w-full items-end justify-center">
									<DialogPrimitive.Popup
										render={
											<motion.div
												layoutId="expenses-toolbar-shell"
												initial={{ opacity: 0, scale: 0.985, y: 6 }}
												animate={{ opacity: 1, scale: 1, y: 0 }}
												exit={{ opacity: 0, scale: 0.985, y: 6 }}
												transition={shellTransition}
											/>
										}
										className="relative w-full max-w-md overflow-hidden rounded-[36px] border border-border/50 bg-white shadow-lg outline-hidden"
									>
										<DialogPrimitive.Title className="sr-only">
											{currentMetadata.title}
										</DialogPrimitive.Title>
										<DialogPrimitive.Description className="sr-only">
											{currentMetadata.description}
										</DialogPrimitive.Description>

										<DialogPrimitive.Close
											render={
												<Button
													type="button"
													variant="ghost"
													size="icon-xs"
													className="absolute right-4 top-4 z-10 flex items-center justify-center transition-transform focus:scale-95 active:scale-75"
												/>
											}
											onClick={() => setView(EXPENSES_TOOLBAR_VIEW.DEFAULT)}
										>
											<XIcon />
										</DialogPrimitive.Close>

										{renderAnimatedContent(
											<motion.div
												key={view}
												initial={{ opacity: 0, scale: 0.985 }}
												animate={{ opacity: 1, scale: 1 }}
												exit={{ opacity: 0, scale: 0.985 }}
												transition={contentTransition}
											>
												{renderFormContent()}
											</motion.div>,
										)}
									</DialogPrimitive.Popup>
								</div>
							</DialogPrimitive.Viewport>
						</DialogPrimitive.Portal>
					</DialogPrimitive.Root>
				)}
			</AnimatePresence>
		</LayoutGroup>
	);
}
