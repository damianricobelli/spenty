import { createServerFn } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";
import { createUniqueSlug } from "./create-unique-slug";
import { GroupSchema } from "./schema";
import { serverDb } from "@/lib/supabase/server";

export const createNewExpense = createServerFn({
  method: "POST",
}).handler(async () => {
  const slug = await createUniqueSlug("expense");
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
