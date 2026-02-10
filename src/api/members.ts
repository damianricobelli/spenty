import { createServerFn } from "@tanstack/react-start";
import { serverDb } from "@/lib/supabase/server";
import { m } from "@/paraglide/messages";
import {
  AddMemberSchema,
  DeleteMemberSchema,
  GroupSchema,
  UpdateMemberSchema,
} from "./schema";

export const getMembers = createServerFn({
  method: "GET",
})
  .inputValidator(GroupSchema)
  .handler(async ({ data: { groupId } }) => {
    const { data, error } = await serverDb()
      .from("members")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching group:", error.message);
      throw error;
    }

    return data;
  });

export const addMember = createServerFn({
  method: "POST",
})
  .inputValidator(AddMemberSchema)
  .handler(async ({ data: { groupId, name } }) => {
    const { data: existing } = await serverDb()
      .from("members")
      .select("id")
      .eq("group_id", groupId)
      .ilike("name", name.trim())
      .maybeSingle();

    if (existing) {
      throw new Error(m.member_already_exists());
    }

    const { data, error } = await serverDb()
      .from("members")
      .insert({ group_id: groupId, name: name.trim() })
      .select("id")
      .single();

    if (error) {
      console.error("Error adding member:", error.message);
      throw error;
    }

    return data;
  });

export const updateMember = createServerFn({
  method: "POST",
})
  .inputValidator(UpdateMemberSchema)
  .handler(async ({ data: { groupId, memberId, name } }) => {
    const { data: existing } = await serverDb()
      .from("members")
      .select("id")
      .eq("group_id", groupId)
      .ilike("name", name.trim())
      .neq("id", memberId)
      .maybeSingle();

    if (existing) {
      throw new Error(m.member_already_exists());
    }

    const { error } = await serverDb()
      .from("members")
      .update({ name: name.trim() })
      .eq("id", memberId)
      .eq("group_id", groupId);

    if (error) {
      console.error("Error updating member:", error.message);
      throw error;
    }
  });

export const deleteMember = createServerFn({
  method: "POST",
})
  .inputValidator(DeleteMemberSchema)
  .handler(async ({ data: { groupId, memberId } }) => {
    const db = serverDb();
    // Delete expenses where this member was the payer (and their splits)
    const { data: expenseIds } = await db
      .from("expenses")
      .select("id")
      .eq("group_id", groupId)
      .eq("paid_by", memberId);
    const ids = expenseIds?.map((e) => e.id) ?? [];
    if (ids.length > 0) {
      await db.from("expense_splits").delete().in("expense_id", ids);
      await db.from("expenses").delete().in("id", ids);
    }
    // Expenses where deleted member had a split: recalc amount for remaining participants (so total stays split among them)
    const { data: splitsWithMember } = await db
      .from("expense_splits")
      .select("expense_id")
      .eq("member_id", memberId);
    const expenseIdsToRecalc = [
      ...new Set((splitsWithMember ?? []).map((s) => s.expense_id)),
    ];
    if (expenseIdsToRecalc.length > 0) {
      const { data: expenses } = await db
        .from("expenses")
        .select("id, amount")
        .eq("group_id", groupId)
        .in("id", expenseIdsToRecalc);
      for (const exp of expenses ?? []) {
        const { data: remainingSplits } = await db
          .from("expense_splits")
          .select("member_id")
          .eq("expense_id", exp.id)
          .neq("member_id", memberId);
        const remainingCount = remainingSplits?.length ?? 0;
        if (remainingCount === 0) continue;
        const amountPerPerson = exp.amount / remainingCount;
        const remainingMemberIds = (remainingSplits ?? []).map(
          (s) => s.member_id,
        );
        const { data: updated, error: updateError } = await db
          .from("expense_splits")
          .update({ amount: amountPerPerson })
          .eq("expense_id", exp.id)
          .in("member_id", remainingMemberIds)
          .select("id");
        if (updateError) {
          console.error("Error recalculating splits:", updateError.message);
          throw updateError;
        }
        if ((updated?.length ?? 0) !== remainingCount) {
          console.error(
            "Recalc updated wrong row count: expected",
            remainingCount,
            "got",
            updated?.length,
            "- check RLS on expense_splits",
          );
          throw new Error(m.error_recalc_splits_failed());
        }
      }
    }
    await db.from("expense_splits").delete().eq("member_id", memberId);
    const { error } = await db
      .from("members")
      .delete()
      .eq("id", memberId)
      .eq("group_id", groupId);
    if (error) {
      console.error("Error deleting member:", error.message);
      throw error;
    }
  });
