import { createServerFn } from "@tanstack/react-start";
import { serverDb } from "@/lib/supabase/server";
import { GroupSchema } from "./schema";

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
