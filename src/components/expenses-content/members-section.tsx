import { useLoaderData } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useExpensesToolbarActions } from "@/components/expenses-toolbar/toolbar-context";
import { useEntity } from "@/hooks/use-entity";
import { getAvatarColorClasses } from "@/lib/avatar-colors";
import { cn } from "@/lib/cn";
import { listItem, reducedFade, springGentle } from "@/lib/motion";
import { m } from "@/paraglide/messages";

const chipClassName =
	"pressable flex h-9 w-fit items-center gap-2 whitespace-nowrap rounded-full border text-sm font-medium";

export function MembersSection() {
	const entity = useEntity();
	const { members } = useLoaderData({ from: entity });
	const reduceMotion = useReducedMotion();
	const toolbarActions = useExpensesToolbarActions();

	const transition = reduceMotion ? reducedFade : springGentle;

	return (
		<section>
			<h2 className="mb-3 text-md font-medium text-muted-foreground">
				{m.content_section_members()}
			</h2>
			<div className="flex flex-wrap items-center gap-2">
				<AnimatePresence initial={false}>
					{members.map((member) => (
						<motion.div
							key={member.id}
							layout={reduceMotion ? false : "position"}
							initial={reduceMotion ? { opacity: 0 } : listItem.initial}
							animate={listItem.animate}
							exit={reduceMotion ? { opacity: 0 } : listItem.exit}
							transition={transition}
						>
							<MemberChip
								name={member.name}
								onEdit={() => toolbarActions?.openEditMember(member.id)}
							/>
						</motion.div>
					))}
				</AnimatePresence>
				{toolbarActions ? (
					<button
						type="button"
						onClick={toolbarActions.openAddMember}
						aria-label={m.toolbar_button_add_member()}
						className={cn(
							chipClassName,
							"border-dashed border-border px-2.5 text-muted-foreground hover:border-foreground/30 hover:text-foreground",
						)}
					>
						<PlusIcon className="size-4" />
					</button>
				) : null}
			</div>
		</section>
	);
}

function MemberChip({ name, onEdit }: { name: string; onEdit: () => void }) {
	const initial = name.trim().charAt(0).toUpperCase() || "?";

	return (
		<button
			type="button"
			onClick={onEdit}
			aria-label={`${m.content_edit()} ${name}`}
			className={cn(
				chipClassName,
				"border-border/60 bg-muted pl-1.5 pr-3 text-foreground shadow-xs hover:border-border",
			)}
		>
			<span
				className={cn(
					"flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
					getAvatarColorClasses(name),
				)}
			>
				{initial}
			</span>
			<span>{name}</span>
		</button>
	);
}
