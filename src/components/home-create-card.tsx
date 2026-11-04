import { ArrowRightIcon, type LucideIcon } from "lucide-react";

type HomeCreateCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  isPending: boolean;
  onCreate: () => void;
};

/**
 * Home action card: one click creates the group right away. Naming happens
 * afterwards, in the guided empty state of the freshly created group.
 */
export function HomeCreateCard({
  icon: Icon,
  title,
  description,
  isPending,
  onCreate,
}: HomeCreateCardProps) {
  return (
    <button
      type="button"
      onClick={onCreate}
      disabled={isPending}
      aria-busy={isPending}
      className="pressable group relative flex flex-1 flex-col gap-5 rounded-2xl border border-border/60 bg-card/80 p-5 text-left shadow-xs backdrop-blur-xl hover:border-foreground/20 hover:shadow-md disabled:opacity-60 sm:p-6"
    >
      <div className="flex gap-5 items-center sm:justify-between">
        <div className="flex size-12 items-center justify-center rounded-xl bg-foreground text-background shrink-0">
          {isPending ? (
            <div className="size-5 animate-spin rounded-full border-2 border-background/30 border-t-background" />
          ) : (
            <Icon className="size-5" />
          )}
        </div>
        <div className="block sm:hidden">
          <h2 className="text-md font-semibold text-foreground">{title}</h2>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
        <ArrowRightIcon className="ml-auto size-5 shrink-0 text-muted-foreground transition-transform duration-200 ease-out group-hover:translate-x-1 sm:ml-0" />
      </div>
      <div className="hidden sm:block">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </button>
  );
}
