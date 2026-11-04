import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { useLoaderData } from "@tanstack/react-router";
import { PlusIcon, XIcon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Toolbar, ToolbarButton } from "@/components/ui/toolbar";
import { useEntity } from "@/hooks/use-entity";
import { easeOut, sheetMotion } from "@/lib/motion";
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

function getViewMetadata(view: ExpensesToolbarView) {
  switch (view) {
    case "add_expense":
      return {
        title: m.toolbar_title_add_expense(),
        description: m.toolbar_description_add_expense(),
      };
    case "edit_expense":
      return {
        title: m.toolbar_title_edit_expense(),
        description: m.toolbar_description_add_expense(),
      };
    case "add_member":
      return {
        title: m.toolbar_title_add_member(),
        description: m.toolbar_description_add_member(),
      };
    case "edit_member":
      return {
        title: m.toolbar_title_edit_member(),
        description: m.toolbar_description_edit_member(),
      };
    default:
      return { title: "", description: "" };
  }
}

const backdropMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, ease: easeOut } },
  exit: { opacity: 0, transition: { duration: 0.15, ease: easeOut } },
} as const;

/** Crossfade between forms; a light blur hides the overlap of two states. */
const contentMotion = {
  initial: { opacity: 0, filter: "blur(2px)" },
  animate: { opacity: 1, filter: "blur(0px)" },
  exit: { opacity: 0, filter: "blur(2px)" },
  transition: { duration: 0.2, ease: easeOut },
} as const;

export function ExpensesToolbar({
  view: controlledView,
  onViewChange,
  editExpenseId,
  editMemberId,
}: ExpensesToolbarProps = {}) {
  const from = useEntity();
  const { members } = useLoaderData({ from });
  const reduceMotion = useReducedMotion();
  const [internalView, setInternalView] = useState<ExpensesToolbarView>(
    EXPENSES_TOOLBAR_VIEW.DEFAULT,
  );

  const isControlled =
    controlledView !== undefined && onViewChange !== undefined;
  const view = isControlled ? controlledView : internalView;
  const setView = (isControlled ? onViewChange : setInternalView) as (
    v: ExpensesToolbarView,
  ) => void;

  const hasMembers = members.length > 0;
  const isDefaultView = view === EXPENSES_TOOLBAR_VIEW.DEFAULT;
  const currentMetadata = getViewMetadata(view);

  const popup = sheetMotion(reduceMotion);

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

  const renderDialog = () => (
    <DialogPrimitive.Root
      key="dialog"
      open
      modal={true}
      onOpenChange={(open) => {
        if (!open) setView(EXPENSES_TOOLBAR_VIEW.DEFAULT);
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          render={
            <motion.div
              initial={backdropMotion.initial}
              animate={backdropMotion.animate}
              exit={backdropMotion.exit}
            />
          }
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs"
        />
        <DialogPrimitive.Viewport className="fixed inset-0 isolate z-50 overflow-y-auto overscroll-contain px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-4 sm:py-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-h-full w-full items-end justify-center sm:items-center">
            <DialogPrimitive.Popup
              render={
                <motion.div
                  initial={popup.initial}
                  animate={popup.animate}
                  exit={popup.exit}
                />
              }
              className="relative w-full max-w-md overflow-hidden rounded-[36px] border border-border/50 bg-popover shadow-lg outline-hidden"
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
                <AnimatePresence initial={false} mode="popLayout">
                  <motion.div
                    key={view}
                    initial={contentMotion.initial}
                    animate={contentMotion.animate}
                    exit={contentMotion.exit}
                    transition={contentMotion.transition}
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

  if (!hasMembers) {
    return isDefaultView ? null : renderDialog();
  }

  return (
    <AnimatePresence initial={false}>
      {isDefaultView ? (
        <motion.div
          key="toolbar"
          initial={{
            opacity: 0,
            transform: reduceMotion ? "none" : "translateY(16px)",
          }}
          animate={{ opacity: 1, transform: "translateY(0px)" }}
          exit={{
            opacity: 0,
            transform: reduceMotion ? "none" : "translateY(16px)",
            transition: { duration: 0.15, ease: easeOut },
          }}
          transition={{ duration: 0.25, ease: easeOut }}
          className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-20 mx-auto w-fit overflow-hidden rounded-full border border-border/50 bg-popover/90 p-1.5 shadow-lg backdrop-blur-xl"
        >
          <Toolbar aria-label={m.toolbar_title_add_expense()}>
            <ToolbarButton
              size="lg"
              className="h-12 px-6 text-base"
              onClick={() => setView(EXPENSES_TOOLBAR_VIEW.ADD_EXPENSE)}
            >
              <PlusIcon data-icon="inline-start" className="size-5" />
              {m.toolbar_button_add_expense()}
            </ToolbarButton>
          </Toolbar>
        </motion.div>
      ) : (
        renderDialog()
      )}
    </AnimatePresence>
  );
}
