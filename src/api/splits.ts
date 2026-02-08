import { createServerFn } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";
import { createUniqueSlug } from "./create-unique-slug";
import { serverDb } from "@/lib/supabase/server";
import { GroupSchema } from "./schema";

export const createNewSplit = createServerFn({
  method: "POST",
}).handler(async () => {
  const slug = await createUniqueSlug("split");
  throw redirect({ to: "/splits/$id", params: { id: slug } });
});

export const getSplit = createServerFn({
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
