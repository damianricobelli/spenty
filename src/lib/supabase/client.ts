import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./supabase";

export function clientDb() {
  return createBrowserClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
  );
}
