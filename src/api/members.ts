import { createServerFn } from "@tanstack/react-start";
import { serverDb } from "@/lib/supabase/server";
import { AddMemberSchema, GroupSchema } from "./schema";

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
      throw new Error("Member already exists");
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
