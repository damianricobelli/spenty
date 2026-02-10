import { serverDb } from "@/lib/supabase/server";
import { m } from "@/paraglide/messages";

export const createUniqueSlug = async (
  type: "expense" | "split",
  groupName: string,
) => {
  const { data, error } = await serverDb().rpc(
    "create_group_with_unique_slug",
    {
      group_name: groupName,
      group_type: type,
    },
  );

  if (error || !data || data.length === 0) {
    throw new Error(m.error_creating_group());
  }

  return data[0].slug;
};
