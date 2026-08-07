import { ArrowRightIcon } from "lucide-react";
import type { SplitDebt } from "@/api/splits";
import { AnimatedCurrency } from "@/components/animated-currency";
import { useEntity } from "@/hooks/use-entity";
import { getAvatarColorClasses } from "@/lib/avatar-colors";
import { cn } from "@/lib/cn";
import { m } from "@/paraglide/messages";

function MemberBadge({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span className="inline-flex items-center gap-1.5 align-middle">
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
          getAvatarColorClasses(name),
        )}
      >
        {initial}
      </span>
      <span>{name}</span>
    </span>
  );
}

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
                <MemberBadge name={d.fromName} />
                <ArrowRightIcon
                  className="mx-1.5 inline-block size-3.5 shrink-0 align-middle text-muted-foreground"
                  aria-hidden
                />
                <MemberBadge name={d.toName} />
              </p>
            </div>
            <span className="shrink-0 text-sm font-semibold tabular-nums tracking-tight">
              <AnimatedCurrency value={d.amount} />
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
