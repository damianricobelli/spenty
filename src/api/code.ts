import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { serverDb } from "@/lib/supabase/server";
import { m } from "@/paraglide/messages";
import { CodeSchema } from "./schema";

export const validateCode = createServerFn({
  method: "GET",
})
  .inputValidator(CodeSchema)
  .handler(async ({ data }) => {
    const { data: group, error } = await serverDb()
      .from("groups")
      .select("slug, type")
      .eq("slug", data.code)
      .single();

    if (error || !group) {
      throw new Error(m.home_page_search_code_not_found());
    }

    if (group.type === "split") {
      throw redirect({ to: "/splits/$id", params: { id: group.slug } });
    }

    throw redirect({ to: "/expenses/$id", params: { id: group.slug } });
  });
