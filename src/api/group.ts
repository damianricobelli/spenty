import { createServerFn } from "@tanstack/react-start";
import { serverDb } from "@/lib/supabase/server";
import {
  CodeSchema,
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
      throw new Error("Incorrect password");
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
