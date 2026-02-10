import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { getExpense } from "@/api/expenses";
import { getGroup } from "@/api/group";
import { getMembers } from "@/api/members";
import { getSplitDebts } from "@/api/splits";
import { EmptyNoMembers } from "@/components/empty-no-members";
import { ExpensesContent } from "@/components/expenses-content";
import {
  EXPENSES_DRAWER_VIEW,
  ExpensesDrawer,
  ExpensesDrawerProvider,
  type ExpensesDrawerView,
} from "@/components/expenses-drawer";
import { Layout } from "@/components/layout";
import { PasswordDialog } from "@/components/password-dialog";
import { isGroupUnlocked } from "@/lib/unlocked-groups";

export const Route = createFileRoute("/splits/$id")({
  component: RouteComponent,
  loader: async ({ params }) => {
    const { id } = params;
    const group = await getGroup({ data: { code: id } });
    const [members, expense, debts] = await Promise.all([
      getMembers({ data: { groupId: group.id } }),
      getExpense({ data: { groupId: group.id } }),
      getSplitDebts({ data: { groupId: group.id } }),
    ]);
    return { group, members, expense, debts };
  },
});

function RouteComponent() {
  const { group, members, expense, debts } = Route.useLoaderData();
  const [drawerView, setDrawerView] = useState<ExpensesDrawerView>(
    EXPENSES_DRAWER_VIEW.DEFAULT,
  );
  const [editExpenseId, setEditExpenseId] = useState<string | null>(null);
  const [editMemberId, setEditMemberId] = useState<string | null>(null);

  if (group.password && !isGroupUnlocked(group.id)) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <PasswordDialog defaultOpen={true} />
      </main>
    );
  }

  const showDrawer =
    members.length > 0 || drawerView !== EXPENSES_DRAWER_VIEW.DEFAULT;

  const handleViewChange = (view: ExpensesDrawerView) => {
    setDrawerView(view);
    if (view === EXPENSES_DRAWER_VIEW.DEFAULT) {
      setEditExpenseId(null);
      setEditMemberId(null);
    }
  };

  return (
    <ExpensesDrawerProvider
      openAddMember={() => setDrawerView(EXPENSES_DRAWER_VIEW.ADD_MEMBER)}
      openEditMember={(id) => {
        setEditMemberId(id);
        setDrawerView(EXPENSES_DRAWER_VIEW.EDIT_MEMBER);
      }}
      openEditExpense={(id) => {
        setEditExpenseId(id);
        setDrawerView(EXPENSES_DRAWER_VIEW.EDIT_EXPENSE);
      }}
    >
      <Layout.Container>
        <Layout.Header />
        <section className="flex min-h-0 flex-1 flex-col">
          {members.length === 0 ? (
            <EmptyNoMembers />
          ) : (
            <ExpensesContent
              groupId={group.id}
              members={members}
              expense={expense}
              routeType="splits"
              debts={debts}
            />
          )}
        </section>
        {showDrawer && (
          <ExpensesDrawer
            view={drawerView}
            onViewChange={handleViewChange}
            editExpenseId={editExpenseId}
            editMemberId={editMemberId}
          />
        )}
      </Layout.Container>
    </ExpensesDrawerProvider>
  );
}
