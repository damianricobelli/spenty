import { Link } from "@tanstack/react-router";
import { ChevronRightIcon, ReceiptIcon, UsersIcon, XIcon } from "lucide-react";
import { isDefaultGroupName } from "@/lib/group-name";
import { forgetGroup, useRecentGroups } from "@/lib/recent-groups";
import { m } from "@/paraglide/messages";

/**
 * Groups opened on this device, so coming back never needs the code.
 * Renders nothing until there is at least one.
 */
export function RecentGroups() {
	const groups = useRecentGroups();
	if (groups.length === 0) return null;

	return (
		<section className="animate-in fade-in slide-in-from-bottom-2 w-full max-w-xl duration-300 ease-out">
			<h2 className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
				{m.home_recent_groups()}
			</h2>
			<ul className="divide-y divide-border/50 overflow-hidden rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl">
				{groups.map((group) => {
					const Icon = group.kind === "split" ? UsersIcon : ReceiptIcon;
					const kindLabel =
						group.kind === "split"
							? m.home_recent_split()
							: m.home_recent_personal();
					const name = isDefaultGroupName(group.name) ? kindLabel : group.name;
					return (
						<li key={group.slug} className="group/row relative flex items-center">
							<Link
								to={group.kind === "split" ? "/splits/$id" : "/expenses/$id"}
								params={{ id: group.slug }}
								search={{}}
								className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-muted/40 active:bg-muted/60"
							>
								<span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
									<Icon className="size-4" />
								</span>
								<span className="min-w-0 flex-1">
									<span className="block truncate text-sm font-medium text-foreground">
										{name}
									</span>
									<span className="block text-xs text-muted-foreground">
										{kindLabel}
									</span>
								</span>
								<ChevronRightIcon className="size-4 shrink-0 text-muted-foreground/60" />
							</Link>
							<button
								type="button"
								onClick={() => forgetGroup(group.slug)}
								aria-label={m.home_recent_forget()}
								className="pressable absolute right-10 hidden size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground group-hover/row:flex focus-visible:flex"
							>
								<XIcon className="size-3.5" />
							</button>
						</li>
					);
				})}
			</ul>
		</section>
	);
}
