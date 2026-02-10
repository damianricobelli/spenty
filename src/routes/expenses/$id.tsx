import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { getExpense } from "@/api/expenses";
import { getGroup } from "@/api/group";
import { getMembers } from "@/api/members";
import { ExpensesContent } from "@/components/expenses-content";
import {
  EXPENSES_DRAWER_VIEW,
  ExpensesDrawer,
  ExpensesDrawerProvider,
  type ExpensesDrawerView,
} from "@/components/expenses-drawer";
import { Layout } from "@/components/layout";
import { PasswordDialog } from "@/components/password-dialog";
import { EmptyNoMembers } from "@/components/ui/empty-no-members";
import { isGroupUnlocked } from "@/lib/unlocked-groups";

export const Route = createFileRoute("/expenses/$id")({
  component: RouteComponent,
  loader: async ({ params }) => {
    const { id } = params;
    const group = await getGroup({ data: { code: id } });
    const members = await getMembers({ data: { groupId: group.id } });
    const expense = await getExpense({ data: { groupId: group.id } });
    return { group, members, expense };
  },
});

function RouteComponent() {
  const { group, members, expense } = Route.useLoaderData();
  const [drawerView, setDrawerView] = useState<ExpensesDrawerView>(EXPENSES_DRAWER_VIEW.DEFAULT);

  if (group.password && !isGroupUnlocked(group.id)) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <PasswordDialog defaultOpen={true} />
      </main>
    );
  }

  const showDrawer = members.length > 0 || drawerView !== EXPENSES_DRAWER_VIEW.DEFAULT;

  return (
    <ExpensesDrawerProvider openAddMember={() => setDrawerView(EXPENSES_DRAWER_VIEW.ADD_MEMBER)}>
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
              routeType="expenses"
            />
          )}
        </section>
        {showDrawer && (
          <ExpensesDrawer view={drawerView} onViewChange={setDrawerView} />
        )}
      </Layout.Container>
    </ExpensesDrawerProvider>
  );
}
