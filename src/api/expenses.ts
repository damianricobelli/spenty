import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { serverDb } from "@/lib/supabase/server";
import { createUniqueSlug } from "./create-unique-slug";
import { AddExpenseEntrySchema, GroupSchema } from "./schema";

export const createNewExpense = createServerFn({
  method: "POST",
})
  .inputValidator((data: { defaultName: string }) => data)
  .handler(async ({ data: { defaultName } }) => {
    const slug = await createUniqueSlug("expense", defaultName);
    throw redirect({ to: "/expenses/$id", params: { id: slug } });
  });

export const getExpense = createServerFn({
  method: "GET",
})
  .inputValidator(GroupSchema)
  .handler(async ({ data: { groupId } }) => {
    const { data, error } = await serverDb()
      .from("expenses")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching split:", error.message);
      throw error;
    }

    return data;
  });

export const addExpenseEntry = createServerFn({
  method: "POST",
})
  .inputValidator(AddExpenseEntrySchema)
  .handler(async ({ data: { groupId, memberId, amount, category, description, paidToMemberIds } }) => {
    const { data, error } = await serverDb()
      .from("expenses")
      .insert({
        group_id: groupId,
        paid_by: memberId,
        amount,
        category: category ?? "",
        description: description ?? "",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error adding expense:", error.message);
      throw error;
    }

    if (paidToMemberIds?.length && data) {
      const amountPerPerson = amount / paidToMemberIds.length;
      const { error: splitError } = await serverDb()
        .from("expense_splits")
        .insert(
          paidToMemberIds.map((member_id) => ({
            expense_id: data.id,
            member_id,
            amount: amountPerPerson,
          })),
        );
      if (splitError) {
        console.error("Error adding expense splits:", splitError.message);
        throw splitError;
      }
    }

    return data;
  });
