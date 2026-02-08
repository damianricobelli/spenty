import { createServerFn } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";
import { createUniqueSlug } from "./create-unique-slug";

export const createNewSplit = createServerFn({
  method: "POST",
}).handler(async () => {
  const slug = await createUniqueSlug("split");
  throw redirect({ to: "/splits/$id", params: { id: slug } });
});
