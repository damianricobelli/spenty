import { createFileRoute } from "@tanstack/react-router";
import { getExpense } from "@/api/expenses";
import { getGroup } from "@/api/group";
import { getMembers } from "@/api/members";
import { GroupPage } from "@/components/group-page";
import { historyFiltersSearchSchema } from "@/lib/history-filters-search";

export const Route = createFileRoute("/expenses/$id")({
	validateSearch: historyFiltersSearchSchema,
	component: RouteComponent,
	loader: async ({ params }) => {
		const group = await getGroup({ data: { code: params.id } });
		// A locked group only exposes its name until the password is entered.
		if (group.isLocked) return { group, members: [], expense: [] };
		const [members, expense] = await Promise.all([
			getMembers({ data: { groupId: group.id } }),
			getExpense({ data: { groupId: group.id } }),
		]);
		return { group, members, expense };
	},
});

function RouteComponent() {
	const { group, members, expense } = Route.useLoaderData();
	const historyFilters = Route.useSearch();
	const navigate = Route.useNavigate();

	return (
		<GroupPage
			group={group}
			members={members}
			expense={expense}
			historyFilters={historyFilters}
			onHistoryFiltersChange={(search) => navigate({ search, replace: true })}
		/>
	);
}
