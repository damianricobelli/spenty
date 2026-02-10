import { useLoaderData } from "@tanstack/react-router";
import { XIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useLayoutEffect, useState } from "react";
import useMeasure from "react-use-measure";
import { Drawer } from "vaul";
import { Button } from "@/components/ui/button";
import { useEntity } from "@/hooks/use-entity";
import { cn } from "@/lib/cn";
import { m } from "@/paraglide/messages";
import { DrawerAddExpenseForm } from "./drawer-add-expense-form";
import { DrawerAddMemberForm } from "./drawer-add-member-form";
import { DrawerDefaultView } from "./drawer-default-view";
import { DrawerEditExpenseForm } from "./drawer-edit-expense-form";
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

type ExpensesDrawerProps = {
  view?: ExpensesDrawerView;
  onViewChange?: (view: ExpensesDrawerView) => void;
  editExpenseId?: string | null;
};

export function ExpensesDrawer(props?: ExpensesDrawerProps) {
  const { view: controlledView, onViewChange, editExpenseId } = props ?? {};
  const from = useEntity();

  const { members } = useLoaderData({
    from,
  });

  const [internalView, setInternalView] = useState<ExpensesDrawerView>(
    EXPENSES_DRAWER_VIEW.DEFAULT,
  );

  const isControlled =
    controlledView !== undefined && onViewChange !== undefined;
  const view = (
    isControlled ? controlledView : internalView
  ) as ExpensesDrawerView;
  const setView = isControlled ? onViewChange : setInternalView;
  const [elementRef, bounds] = useMeasure();

  useDrawerFocusBypass();

  const content = (view: ExpensesDrawerView) => {
    switch (view) {
      case "default":
        return <DrawerDefaultView members={members} onViewChange={setView} />;
      case "add_expense":
        return <DrawerAddExpenseForm resetDrawer={() => setView("default")} />;
      case "edit_expense":
        return editExpenseId ? (
          <DrawerEditExpenseForm
            key={editExpenseId}
            expenseId={editExpenseId}
            resetDrawer={() => setView("default")}
          />
        ) : null;
      case "add_member":
        return <DrawerAddMemberForm resetDrawer={() => setView("default")} />;
    }
  };

  const showOverlay = members.length === 0;

  return (
    <Drawer.Root open modal={showOverlay} dismissible={false}>
      <Drawer.Portal>
        <Drawer.Overlay
          className={cn(
            showOverlay &&
              "fixed inset-0 z-20 bg-black/80 supports-backdrop-filter:backdrop-blur-xs",
          )}
        />
        <Drawer.Content
          asChild
          onInteractOutside={() => setView("default")}
          onEscapeKeyDown={() => setView("default")}
          className={cn(
            "fixed inset-x-4 bottom-4 z-20 border border-border/50 bg-white shadow-lg backdrop-blur-xl mx-auto overflow-hidden rounded-[36px] outline-hidden md:mx-auto md:w-full",
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
                : view === "edit_expense"
                  ? m.drawer_title_edit_expense()
                  : m.drawer_title_add_member()}
            </Drawer.Title>
            <Drawer.Description className="sr-only">
              {view === "add_expense"
                ? m.drawer_description_add_expense()
                : view === "edit_expense"
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
