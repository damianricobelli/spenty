import { createServerFn } from "@tanstack/react-start";
import { serverDb } from "@/lib/supabase/server";
import { CodeSchema, UpdateGroupNameSchema } from "./schema";

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
