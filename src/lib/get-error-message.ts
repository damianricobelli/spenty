import { ZodError } from "zod";

export function getErrorMessage(error: unknown): string {
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? error.message;
  }
  if (Array.isArray(error) && error[0]?.message) {
    return String(error[0].message);
  }
  if (error instanceof Error) {
    const msg = error.message;
    try {
      const parsed = JSON.parse(msg) as unknown;
      if (Array.isArray(parsed) && parsed[0]?.message) {
        return String(parsed[0].message);
      }
    } catch {
      // no es JSON
    }
    return msg;
  }
  return "An error occurred";
}
