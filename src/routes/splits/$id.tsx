import { createFileRoute } from "@tanstack/react-router";
import { getExpense } from "@/api/expenses";
import { getGroup } from "@/api/group";
import { getMembers } from "@/api/members";
import { ExpensesDrawer } from "@/components/expenses-drawer";
import { Layout } from "@/components/layout";
import { PasswordDialog } from "@/components/password-dialog";
import { EmptyNoMembers } from "@/components/ui/empty-no-members";
import { isGroupUnlocked } from "@/lib/unlocked-groups";

export const Route = createFileRoute("/splits/$id")({
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
  const { group, members } = Route.useLoaderData();

  if (group.password && !isGroupUnlocked(group.id)) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <PasswordDialog defaultOpen={true} />
      </main>
    );
  }

  return (
    <Layout.Container>
      <Layout.Header />
      <section className="flex min-h-0 flex-1 flex-col">
        {members.length === 0 ? <EmptyNoMembers /> : null}
      </section>
      <ExpensesDrawer />
    </Layout.Container>
  );
}
