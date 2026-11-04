import { createFileRoute } from "@tanstack/react-router";
import { getExpense } from "@/api/expenses";
import { getGroup } from "@/api/group";
import { getMembers } from "@/api/members";
import { getSplitDebts } from "@/api/splits";
import { GroupPage } from "@/components/group-page";
import { historyFiltersSearchSchema } from "@/lib/history-filters-search";

export const Route = createFileRoute("/splits/$id")({
	validateSearch: historyFiltersSearchSchema,
	component: RouteComponent,
	loader: async ({ params }) => {
		const group = await getGroup({ data: { code: params.id } });
		// A locked group only exposes its name until the password is entered.
		if (group.isLocked) {
			return { group, members: [], expense: [], debts: [] };
		}
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
	const historyFilters = Route.useSearch();
	const navigate = Route.useNavigate();

	return (
		<GroupPage
			group={group}
			members={members}
			expense={expense}
			debts={debts}
			historyFilters={historyFilters}
			onHistoryFiltersChange={(search) => navigate({ search, replace: true })}
		/>
	);
}
