import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { serverDb } from "@/lib/supabase/server";

const CodeSchema = z.object({
  code: z.string().min(10).max(10),
});

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
      throw new Error("Code not found");
    }

    if (group.type === "split") {
      throw redirect({ to: "/splits/$id", params: { id: group.slug } });
    }

    throw redirect({ to: "/expenses/$id", params: { id: group.slug } });
  });
