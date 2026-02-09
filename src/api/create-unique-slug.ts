import { serverDb } from "@/lib/supabase/server";

const defaultGroupName: Record<"expense" | "split", string> = {
  expense: "",
  split: "split",
};

export const createUniqueSlug = async (type: "expense" | "split") => {
  const { data, error } = await serverDb().rpc(
    "create_group_with_unique_slug",
    {
      group_name: defaultGroupName[type],
      group_type: type,
    },
  );

  if (error || !data || data.length === 0) {
    throw new Error("Error creating group");
  }

  return data[0].slug;
};
