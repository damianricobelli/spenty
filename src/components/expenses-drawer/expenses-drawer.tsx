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
import { DrawerDefaultView } from "./drawer-default-view";
import { DrawerExpenseForm } from "./drawer-expense-form";
import { DrawerMemberForm } from "./drawer-member-form";
import { EXPENSES_DRAWER_VIEW, type ExpensesDrawerView } from "./types";

type ExpensesDrawerProps = {
  view?: ExpensesDrawerView;
  onViewChange?: (view: ExpensesDrawerView) => void;
  editExpenseId?: string | null;
  editMemberId?: string | null;
};

/**
 * Bypass focus-trap when using Select inside Drawer/Dialog.
 * @see https://github.com/emilkowalski/vaul/issues/497#issuecomment-2452503724
 */
function useDrawerFocusBypass() {
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
    title: m.drawer_title_add_expense(),
    description: m.drawer_description_add_expense(),
  },
  edit_expense: {
    title: m.drawer_title_edit_expense(),
    description: m.drawer_description_add_expense(),
  },
  add_member: {
    title: m.drawer_title_add_member(),
    description: m.drawer_description_add_member(),
  },
  edit_member: {
    title: m.drawer_title_edit_member(),
    description: m.drawer_description_edit_member(),
  },
  default: { title: "", description: "" }
}

export function ExpensesDrawer({
  view: controlledView,
  onViewChange,
  editExpenseId,
  editMemberId,
}: ExpensesDrawerProps = {}) {
  const from = useEntity();
  const { members } = useLoaderData({ from });
  const [internalView, setInternalView] = useState<ExpensesDrawerView>(EXPENSES_DRAWER_VIEW.DEFAULT);

  const isControlled = controlledView !== undefined && onViewChange !== undefined;
  const view = isControlled ? controlledView : internalView;
  const setView = (isControlled ? onViewChange : setInternalView) as (v: ExpensesDrawerView) => void;

  const [elementRef, bounds] = useMeasure();

  useDrawerFocusBypass();

  const renderContent = () => {
    const reset = () => setView("default");

    switch (view) {
      case "default":
        return <DrawerDefaultView members={members} onViewChange={setView} />;
      
      case "add_expense":
        return <DrawerExpenseForm intent="add" resetDrawer={reset} />;
      
      case "edit_expense":
        if (!editExpenseId) return null;
        return <DrawerExpenseForm key={editExpenseId} intent="edit" expenseId={editExpenseId} resetDrawer={reset} />;
      
      case "add_member":
        return <DrawerMemberForm intent="add" resetDrawer={reset} />;
      
      case "edit_member":
        if (!editMemberId) return null;
        return <DrawerMemberForm key={editMemberId} intent="edit" memberId={editMemberId} resetDrawer={reset} />;
      
      default:
        return null;
    }
  };

  const isDefaultView = view === "default";
  const showOverlay = members.length === 0;
  const currentMetadata = viewMetadata[view as keyof typeof viewMetadata] || viewMetadata.default;

  return (
    <Drawer.Root open modal={showOverlay} dismissible={false}>
      <Drawer.Portal>
        <Drawer.Overlay
          className={cn(showOverlay && "fixed inset-0 z-20 bg-black/80 backdrop-blur-xs")}
        />
        
        <Drawer.Content
          asChild
          onEscapeKeyDown={() => setView("default")}
          className={cn(
            "fixed inset-x-4 bottom-4 z-20 border border-border/50 bg-white shadow-lg backdrop-blur-xl mx-auto overflow-hidden rounded-[36px] outline-hidden md:w-full",
            {
              "max-w-fit": isDefaultView,
              "max-w-full md:max-w-md": !isDefaultView
            }
          )}
        >
          <motion.div
            animate={{
              height: bounds.height,
              transition: { duration: 0.27, ease: [0.25, 1, 0.5, 1] },
            }}
          >
            <Drawer.Title className="sr-only">{currentMetadata.title}</Drawer.Title>
            <Drawer.Description className="sr-only">{currentMetadata.description}</Drawer.Description>

            {!isDefaultView && (
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
              <AnimatePresence initial={false} mode="popLayout">
                <motion.div
                  key={view}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.27, ease: [0.26, 0.08, 0.25, 1] }}
                >
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}