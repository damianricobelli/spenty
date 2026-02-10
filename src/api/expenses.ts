import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { serverDb } from "@/lib/supabase/server";
import { m } from "@/paraglide/messages";
import { createUniqueSlug } from "./create-unique-slug";
import {
  AddExpenseEntrySchema,
  DeleteExpenseSchema,
  GroupSchema,
  UpdateExpenseEntrySchema,
} from "./schema";

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
  .handler(async ({ data: { groupId, memberId, amount, category, description, paidToMemberIds, paymentDate } }) => {
    const { data, error } = await serverDb()
      .from("expenses")
      .insert({
        group_id: groupId,
        paid_by: memberId,
        amount,
        category: category ?? "",
        description: description ?? "",
        expense_date: paymentDate ?? null,
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

export const getExpenseWithSplits = createServerFn({
  method: "GET",
})
  .inputValidator(z.object({ expenseId: z.string().uuid() }))
  .handler(async ({ data: { expenseId } }) => {
    const db = serverDb();
    const { data: expense, error: expenseError } = await db
      .from("expenses")
      .select("id, group_id, paid_by, amount, category, description, expense_date")
      .eq("id", expenseId)
      .maybeSingle();
    if (expenseError || !expense) return null;
    const { data: splits } = await db
      .from("expense_splits")
      .select("member_id")
      .eq("expense_id", expenseId);
    return {
      ...expense,
      paidToMemberIds: (splits ?? []).map((s) => s.member_id),
    };
  });

export const updateExpenseEntry = createServerFn({
  method: "POST",
})
  .inputValidator(UpdateExpenseEntrySchema)
  .handler(
    async ({
      data: {
        groupId,
        expenseId,
        memberId,
        amount,
        category,
        description,
        paidToMemberIds,
        paymentDate,
      },
    }) => {
      const db = serverDb();
      const { data: existing } = await db
        .from("expenses")
        .select("id")
        .eq("id", expenseId)
        .eq("group_id", groupId)
        .maybeSingle();
      if (!existing) throw new Error(m.expense_not_found());
      const { error: updateError } = await db
        .from("expenses")
        .update({
          paid_by: memberId,
          amount,
          category: category ?? "",
          description: description ?? "",
          expense_date: paymentDate ?? null,
        })
        .eq("id", expenseId)
        .eq("group_id", groupId);
      if (updateError) {
        console.error("Error updating expense:", updateError.message);
        throw updateError;
      }
      await db.from("expense_splits").delete().eq("expense_id", expenseId);
      if (paidToMemberIds?.length) {
        const amountPerPerson = amount / paidToMemberIds.length;
        const { error: splitError } = await db.from("expense_splits").insert(
          paidToMemberIds.map((member_id) => ({
            expense_id: expenseId,
            member_id,
            amount: amountPerPerson,
          })),
        );
        if (splitError) {
          console.error("Error updating expense splits:", splitError.message);
          throw splitError;
        }
      }
    },
  );

export const deleteExpense = createServerFn({
  method: "POST",
})
  .inputValidator(DeleteExpenseSchema)
  .handler(async ({ data: { groupId, expenseId } }) => {
    const db = serverDb();
    const { data: expense } = await db
      .from("expenses")
      .select("id")
      .eq("id", expenseId)
      .eq("group_id", groupId)
      .maybeSingle();
    if (!expense) {
      throw new Error(m.expense_not_found());
    }
    await db.from("expense_splits").delete().eq("expense_id", expenseId);
    const { error } = await db.from("expenses").delete().eq("id", expenseId);
    if (error) {
      console.error("Error deleting expense:", error.message);
      throw error;
    }
  });
