import { DollarSignIcon, UserPlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { m } from "@/paraglide/messages";
import type { ExpensesToolbarMember, ExpensesToolbarView } from "./types";

type ToolbarDefaultViewProps = {
	members: ExpensesToolbarMember[];
	onViewChange: (view: ExpensesToolbarView) => void;
};

export function ToolbarDefaultView({
	members,
	onViewChange,
}: ToolbarDefaultViewProps) {
	const hasMembers = members.length > 0;

	return (
		<div className="flex items-center justify-center py-2 px-3">
			<div className="flex min-w-0 items-center justify-center gap-2 sm:gap-3">
				{hasMembers && (
					<Button
						size="lg"
						onClick={() => onViewChange("add_expense")}
						aria-label={m.toolbar_button_add_expense()}
					>
						<DollarSignIcon data-icon="inline-start" />
						{m.toolbar_button_add_expense()}
					</Button>
				)}

				<Button
					variant={hasMembers ? "ghost" : "default"}
					size="lg"
					onClick={() => onViewChange("add_member")}
					aria-label={m.toolbar_button_add_member()}
					className={hasMembers ? "bg-muted/70" : undefined}
				>
					<UserPlusIcon data-icon="inline-start" />
					{m.toolbar_button_add_member()}
				</Button>
			</div>
		</div>
	);
}
