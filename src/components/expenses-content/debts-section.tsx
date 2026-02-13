import { ArrowRightIcon } from "lucide-react";
import type { SplitDebt } from "@/api/splits";
import { useEntity } from "@/hooks/use-entity";
import { formatCurrency } from "@/lib/format-currency";
import { m } from "@/paraglide/messages";

export function DebtsSection({ debts }: { debts: SplitDebt[] }) {
	const entity = useEntity();

	if (!entity.includes("/splits/") || debts.length === 0) {
		return null;
	}

	return (
		<section>
			<h2 className="mb-3 text-md font-medium text-muted-foreground">
				{m.content_section_who_owes()}
			</h2>
			<ul className="divide-y divide-border/50 overflow-hidden rounded-2xl border border-border/50 shadow-sm">
				{debts.map((d, i) => (
					<li
						key={`${d.fromMemberId}-${d.toMemberId}-${i}`}
						className="flex items-center justify-between gap-3 px-4 py-3"
					>
						<div className="min-w-0 flex-1 text-sm">
							<p className="font-medium text-foreground">
								<span>{d.fromName}</span>
								<ArrowRightIcon
									className="mx-1.5 inline-block size-3.5 shrink-0 align-middle text-muted-foreground"
									aria-hidden
								/>
								<span>{d.toName}</span>
							</p>
						</div>
						<span className="shrink-0 text-sm font-semibold tabular-nums tracking-tight">
							{formatCurrency(d.amount)}
						</span>
					</li>
				))}
			</ul>
		</section>
	);
}
