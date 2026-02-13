import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { serverDb } from "@/lib/supabase/server";
import { createUniqueSlug } from "./create-unique-slug";
import { GroupSchema } from "./schema";

export type SplitDebt = {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  fromName: string;
  toName: string;
};

export const createNewSplit = createServerFn({
  method: "POST",
})
  .inputValidator((data: { defaultName: string }) => data)
  .handler(async ({ data: { defaultName } }) => {
    const slug = await createUniqueSlug("split", defaultName);
    throw redirect({ to: "/splits/$id", params: { id: slug }, search: {} });
  });

export const getSplit = createServerFn({
  method: "GET",
})
  .inputValidator(GroupSchema)
  .handler(async ({ data: { groupId } }) => {
    const { data, error } = await serverDb()
      .from("expenses")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching split:", error.message);
      throw error;
    }

    return data;
  });

function simplifyDebts(
  balances: Map<string, number>,
): { from: string; to: string; amount: number }[] {
  const debts: { from: string; to: string; amount: number }[] = [];
  const entries = Array.from(balances.entries())
    .filter(([, b]) => Math.abs(b) > 1e-6)
    .map(([id, b]) => ({ id, balance: b }));
  const debtors = entries
    .filter((e) => e.balance < 0)
    .sort((a, b) => a.balance - b.balance);
  const creditors = entries
    .filter((e) => e.balance > 0)
    .sort((a, b) => b.balance - a.balance);
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i];
    const c = creditors[j];
    const amount = Math.min(-d.balance, c.balance);
    if (amount <= 0) break;
    debts.push({ from: d.id, to: c.id, amount });
    d.balance += amount;
    c.balance -= amount;
    if (d.balance >= -1e-6) i++;
    if (c.balance <= 1e-6) j++;
  }
  return debts;
}

export const getSplitDebts = createServerFn({
  method: "GET",
})
  .inputValidator(GroupSchema)
  .handler(async ({ data: { groupId } }): Promise<SplitDebt[]> => {
    const db = serverDb();
    const { data: expenses } = await db
      .from("expenses")
      .select("id, paid_by, amount")
      .eq("group_id", groupId);
    const expenseIds = (expenses ?? []).map((e) => e.id);
    const { data: splits } =
      expenseIds.length > 0
        ? await db
            .from("expense_splits")
            .select("expense_id, member_id, amount")
            .in("expense_id", expenseIds)
        : { data: [] };
    const { data: members } = await db
      .from("members")
      .select("id, name")
      .eq("group_id", groupId);
    const nameById = new Map((members ?? []).map((m) => [m.id, m.name]));

    const balances = new Map<string, number>();
    for (const e of expenses ?? []) {
      balances.set(e.paid_by, (balances.get(e.paid_by) ?? 0) + e.amount);
    }
    for (const s of splits ?? []) {
      balances.set(s.member_id, (balances.get(s.member_id) ?? 0) - s.amount);
    }

    const rawDebts = simplifyDebts(balances);
    return rawDebts.map((d) => ({
      fromMemberId: d.from,
      toMemberId: d.to,
      amount: d.amount,
      fromName: nameById.get(d.from) ?? "",
      toName: nameById.get(d.to) ?? "",
    }));
  });
