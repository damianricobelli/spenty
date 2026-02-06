import { createServerFn } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";
import { createUniqueSlug } from "@/data/api.create-unique-slug";

export const createNewExpense = createServerFn({
  method: "POST",
}).handler(async () => {
  const slug = await createUniqueSlug("expense");
  throw redirect({ to: "/expenses/$id", params: { id: slug } });
});
