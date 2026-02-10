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

export const AddMemberSchema = GroupSchema.extend({
  name: z.string().trim().min(1).max(120),
});
export type AddMember = z.infer<typeof AddMemberSchema>;

export const AddExpenseEntrySchema = GroupSchema.extend({
  memberId: z.uuid(),
  amount: z.number().positive(),
  category: z.string().trim().max(60).optional(),
  description: z.string().trim().max(500).optional(),
  /** When set (splits), the members that received the payment. Required for splits, 1 or more. */
  paidToMemberIds: z.array(z.uuid()).min(1).optional(),
  /** Optional payment date (ISO date string YYYY-MM-DD). */
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
export type AddExpenseEntry = z.infer<typeof AddExpenseEntrySchema>;

export const DeleteMemberSchema = GroupSchema.extend({
  memberId: z.uuid(),
});
export type DeleteMember = z.infer<typeof DeleteMemberSchema>;

export const DeleteExpenseSchema = GroupSchema.extend({
  expenseId: z.uuid(),
});
export type DeleteExpense = z.infer<typeof DeleteExpenseSchema>;

export const UpdateExpenseEntrySchema = GroupSchema.extend({
  expenseId: z.uuid(),
  memberId: z.uuid(),
  amount: z.number().positive(),
  category: z.string().trim().max(60).optional(),
  description: z.string().trim().max(500).optional(),
  paidToMemberIds: z.array(z.uuid()).min(1).optional(),
  /** Optional payment date (ISO date string YYYY-MM-DD). */
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
export type UpdateExpenseEntry = z.infer<typeof UpdateExpenseEntrySchema>;
