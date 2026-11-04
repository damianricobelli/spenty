import { Loader2Icon, Trash2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { m } from "@/paraglide/messages";

const DISARM_AFTER_MS = 3500;

/**
 * Delete without a second dialog: the first tap arms the button, the second
 * one confirms. It disarms on its own if the user walks away.
 */
export function ConfirmDeleteButton({
	label,
	warning,
	isPending,
	onConfirm,
	className,
}: {
	label: string;
	/** Shown while armed, for deletes with side effects worth spelling out. */
	warning?: string;
	isPending: boolean;
	onConfirm: () => void;
	className?: string;
}) {
	const [armed, setArmed] = useState(false);

	useEffect(() => {
		if (!armed || isPending) return;
		const timeout = setTimeout(() => setArmed(false), DISARM_AFTER_MS);
		return () => clearTimeout(timeout);
	}, [armed, isPending]);

	return (
		<div className={cn("flex flex-col items-center gap-2", className)}>
			<Button
				type="button"
				variant="destructive"
				disabled={isPending}
				aria-live="polite"
				onClick={() => (armed ? onConfirm() : setArmed(true))}
				className={cn(
					"w-full",
					armed &&
						"bg-destructive text-destructive-foreground hover:bg-destructive/90 dark:bg-destructive dark:hover:bg-destructive/90",
				)}
			>
				{isPending ? (
					<Loader2Icon className="animate-spin" />
				) : (
					<Trash2Icon data-icon="inline-start" />
				)}
				{armed ? m.content_delete_confirm_tap() : label}
			</Button>
			{armed && warning ? (
				<p className="animate-in fade-in text-balance text-center text-xs text-muted-foreground duration-200">
					{warning}
				</p>
			) : null}
		</div>
	);
}
