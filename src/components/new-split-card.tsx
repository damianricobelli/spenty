import { useCreateSplit } from "@/hooks/splits/use-create-split";
import { ArrowRightIcon, UsersIcon } from "lucide-react";
import { m } from "@/paraglide/messages";

export const NewSplitCard = () => {
  const createSplit = useCreateSplit();

  return (
    <button
      type="button"
      onClick={() => createSplit.mutate(m.create_default_split_name())}
      disabled={createSplit.isPending}
      className="group relative flex flex-1 flex-col gap-5 rounded-2xl border border-border/60 bg-card/80 p-6 text-left backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-lg disabled:opacity-50"
    >
      <div className="flex gap-5 items-center sm:justify-between">
        <div className="flex size-12 items-center justify-center rounded-xl bg-foreground text-background shrink-0">
          {createSplit.isPending ? (
            <div className="size-5 animate-spin rounded-full border-2 border-background/30 border-t-background" />
          ) : (
            <UsersIcon className="size-5" />
          )}
        </div>
        <div className="block sm:hidden">
          <h2 className="text-md font-semibold text-foreground">
            {m.home_page_split_card_title()}
          </h2>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {m.home_page_split_card_description()}
          </p>
        </div>
        <ArrowRightIcon className="hidden sm:block size-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
      </div>
      <div className="hidden sm:block">
        <h2 className="text-lg font-semibold text-foreground">
          {m.home_page_split_card_title()}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {m.home_page_split_card_description()}
        </p>
      </div>
    </button>
  );
};
