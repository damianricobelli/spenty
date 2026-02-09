import { z } from "zod";

export const CodeSchema = z.object({
  code: z.string().min(8).max(8),
});

export const GroupSchema = z.object({
  groupId: z.uuid(),
});

export const UpdateGroupNameSchema = z.object({
  name: z.string().trim().min(1).max(36),
  groupId: z.uuid(),
});
export type UpdateGroupName = z.infer<typeof UpdateGroupNameSchema>;

export const PasswordSchema = z.object({
  password: z.string().min(1),
});

export const GroupPasswordSchema = z.object({
  password: z.string().min(1),
  groupId: z.uuid(),
});

export const GroupPasswordWithIntentSchema = GroupPasswordSchema.extend({
  intent: z.enum(["set", "remove"]),
});

export type GroupPassword = z.infer<typeof GroupPasswordWithIntentSchema>;
