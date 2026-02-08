import { z } from "zod";

export const CodeSchema = z.object({
  code: z.string().min(8).max(8),
});

export const GroupSchema = z.object({
  groupId: z.uuid(),
});

export const UpdateGroupNameSchema = z.object({
  name: z.string().min(2).max(36),
  groupId: z.uuid(),
});
export type UpdateGroupName = z.infer<typeof UpdateGroupNameSchema>;
