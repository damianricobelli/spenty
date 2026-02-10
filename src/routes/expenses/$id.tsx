import { createFileRoute } from "@tanstack/react-router";
import { getExpense } from "@/api/expenses";
import { getGroup } from "@/api/group";
import { getMembers } from "@/api/members";
import { ExpensesDrawer } from "@/components/expenses-drawer";
import { Layout } from "@/components/layout";
import { PasswordDialog } from "@/components/password-dialog";
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
  const { group } = Route.useLoaderData();

  if (group.password && !isGroupUnlocked(group.id)) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <PasswordDialog from="expenses" defaultOpen={true} />
      </main>
    );
  }

  return (
    <Layout.Container>
      <Layout.Header from="expenses" />
      <ExpensesDrawer from="expenses" />
    </Layout.Container>
  );
}
