import { UsersIcon } from "lucide-react";
import { HomeCreateCard } from "@/components/home-create-card";
import { useCreateSplit } from "@/hooks/splits/use-create-split";
import { m } from "@/paraglide/messages";

export const NewSplitCard = () => {
  const createSplit = useCreateSplit();

  return (
    <HomeCreateCard
      icon={UsersIcon}
      title={m.home_page_split_card_title()}
      description={m.home_page_split_card_description()}
      isPending={createSplit.isPending}
      onCreate={() => createSplit.mutate(m.create_default_split_name())}
    />
  );
};
