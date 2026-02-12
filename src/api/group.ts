import { createServerFn } from "@tanstack/react-start";
import { serverDb } from "@/lib/supabase/server";
import { m } from "@/paraglide/messages";
import {
  CodeSchema,
  DeleteGroupSchema,
  GroupPasswordSchema,
  GroupSchema,
  UpdateGroupNameSchema,
} from "./schema";

export const getGroup = createServerFn({
  method: "GET",
})
  .inputValidator(CodeSchema)
  .handler(async ({ data: { code } }) => {
    const { data, error } = await serverDb()
      .from("groups")
      .select("id, name, password, slug")
      .eq("slug", code)
      .single();

    if (error) {
      console.error("Error fetching group:", error.message);
      throw error;
    }

    return data;
  });

export const updateGroupName = createServerFn({
  method: "POST",
})
  .inputValidator(UpdateGroupNameSchema)
  .handler(async ({ data: { name, groupId } }) => {
    const { error } = await serverDb()
      .from("groups")
      .update({ name: name.trim() })
      .eq("id", groupId);

    if (error) {
      console.error("Error updating group name:", error.message);
      throw error.message;
    }
  });

export const getGroupPassword = createServerFn({
  method: "GET",
})
  .inputValidator(GroupSchema)
  .handler(async ({ data: { groupId } }) => {
    const { data, error } = await serverDb()
      .from("groups")
      .select("password")
      .eq("id", groupId)
      .single();

    if (error) {
      console.error("Error fetching group password:", error.message);
      throw error;
    }

    return data.password;
  });

export const setPassword = createServerFn({
  method: "POST",
})
  .inputValidator(GroupPasswordSchema)
  .handler(async ({ data: { password, groupId } }) => {
    const { error } = await serverDb()
      .from("groups")
      .update({ password: password.trim() })
      .eq("id", groupId);

    if (error) {
      console.error("Error updating group password:", error.message);
      throw error.message;
    }
  });

export const removePassword = createServerFn({
  method: "POST",
})
  .inputValidator(GroupPasswordSchema)
  .handler(async ({ data: { password, groupId } }) => {
    const currentPassword = await getGroupPassword({ data: { groupId } });
    if (currentPassword !== password) {
      throw new Error(m.password_incorrect());
    }
    const { error } = await serverDb()
      .from("groups")
      .update({ password: null })
      .eq("id", groupId);

    if (error) {
      console.error("Error removing group password:", error.message);
      throw error.message;
    }
  });

export const deleteGroup = createServerFn({
  method: "POST",
})
  .inputValidator(DeleteGroupSchema)
  .handler(async ({ data: { groupId, name } }) => {
    const db = serverDb();
    const { data: group, error: fetchError } = await db
      .from("groups")
      .select("id, name")
      .eq("id", groupId)
      .single();

    if (fetchError || !group) {
      console.error("Error fetching group:", fetchError?.message);
      throw new Error(m.error_creating_group());
    }

    if (group.name.trim() !== name.trim()) {
      throw new Error(m.header_delete_group_name_mismatch());
    }

    const { data: expenseRows } = await db
      .from("expenses")
      .select("id")
      .eq("group_id", groupId);
    const expenseIds = expenseRows?.map((r) => r.id) ?? [];
    if (expenseIds.length > 0) {
      await db.from("expense_splits").delete().in("expense_id", expenseIds);
      await db.from("expenses").delete().in("id", expenseIds);
    }
    await db.from("members").delete().eq("group_id", groupId);
    await db.from("group_categories").delete().eq("group_id", groupId);
    const { error } = await db.from("groups").delete().eq("id", groupId);
    if (error) {
      console.error("Error deleting group:", error.message);
      throw error;
    }
  });
