import { ReceiptIcon } from "lucide-react";
import { HomeCreateCard } from "@/components/home-create-card";
import { useCreateExpense } from "@/hooks/expenses/use-create-expense";
import { m } from "@/paraglide/messages";

export const NewExpenseCard = () => {
  const createExpense = useCreateExpense();

  return (
    <HomeCreateCard
      icon={ReceiptIcon}
      title={m.home_page_expense_card_title()}
      description={m.home_page_expense_card_description()}
      isPending={createExpense.isPending}
      onCreate={() => createExpense.mutate(m.create_default_expense_name())}
    />
  );
};
