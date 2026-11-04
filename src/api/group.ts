import { createServerFn } from "@tanstack/react-start";
import {
	assertGroupAccess,
	getStoredPassword,
	grantGroupAccess,
	hashPassword,
	hasGroupAccess,
	revokeGroupAccess,
	verifyPassword,
} from "@/lib/group-access.server";
import { serverDb } from "@/lib/supabase/server";
import { m } from "@/paraglide/messages";
import {
	CodeSchema,
	DeleteGroupSchema,
	GroupPasswordSchema,
	UpdateGroupNameSchema,
} from "./schema";

/**
 * Public group info. Never includes the password: the client only learns
 * whether the group is protected and whether this browser has unlocked it.
 */
export const getGroup = createServerFn({
	method: "GET",
})
	.validator(CodeSchema)
	.handler(async ({ data: { code } }) => {
		const { data, error } = await serverDb()
			.from("groups")
			.select("id, name, password, slug")
			.eq("slug", code)
			.single();

		if (error) {
			console.error("Error fetching group:", error.message);
			throw error;
		}

		const { password, ...group } = data;
		return {
			...group,
			hasPassword: Boolean(password),
			isLocked: !hasGroupAccess(group.id, password),
		};
	});

export const updateGroupName = createServerFn({
	method: "POST",
})
	.validator(UpdateGroupNameSchema)
	.handler(async ({ data: { name, groupId } }) => {
		await assertGroupAccess(groupId);
		const { error } = await serverDb()
			.from("groups")
			.update({ name: name.trim() })
			.eq("id", groupId);

		if (error) {
			console.error("Error updating group name:", error.message);
			throw error.message;
		}
	});

/** Checks the password and, if it matches, remembers the unlock in a cookie. */
export const unlockGroup = createServerFn({
	method: "POST",
})
	.validator(GroupPasswordSchema)
	.handler(async ({ data: { password, groupId } }) => {
		const stored = await getStoredPassword(groupId);
		if (!stored) return;
		if (!(await verifyPassword(password, stored))) {
			throw new Error(m.password_incorrect());
		}
		const hash = await upgradeLegacyPassword(groupId, password, stored);
		grantGroupAccess(groupId, hash);
	});

/** Sets or changes the password. Changing it requires access to the group. */
export const setPassword = createServerFn({
	method: "POST",
})
	.validator(GroupPasswordSchema)
	.handler(async ({ data: { password, groupId } }) => {
		await assertGroupAccess(groupId);
		const hash = await hashPassword(password);
		const { error } = await serverDb()
			.from("groups")
			.update({ password: hash })
			.eq("id", groupId);

		if (error) {
			console.error("Error updating group password:", error.message);
			throw error.message;
		}
		// The person who set it stays in; everyone else needs the new password.
		grantGroupAccess(groupId, hash);
	});

export const removePassword = createServerFn({
	method: "POST",
})
	.validator(GroupPasswordSchema)
	.handler(async ({ data: { password, groupId } }) => {
		const stored = await getStoredPassword(groupId);
		if (!stored) return;
		if (!(await verifyPassword(password, stored))) {
			throw new Error(m.password_incorrect());
		}
		const { error } = await serverDb()
			.from("groups")
			.update({ password: null })
			.eq("id", groupId);

		if (error) {
			console.error("Error removing group password:", error.message);
			throw error.message;
		}
		revokeGroupAccess(groupId);
	});

/** Replaces a pre-hashing plaintext password with its hash. */
async function upgradeLegacyPassword(
	groupId: string,
	plain: string,
	stored: string,
) {
	if (stored.startsWith("scrypt$")) return stored;
	const hash = await hashPassword(plain);
	const { error } = await serverDb()
		.from("groups")
		.update({ password: hash })
		.eq("id", groupId);
	if (error) {
		console.error("Error upgrading group password:", error.message);
		return stored;
	}
	return hash;
}

export const deleteGroup = createServerFn({
	method: "POST",
})
	.validator(DeleteGroupSchema)
	.handler(async ({ data: { groupId, name } }) => {
		await assertGroupAccess(groupId);
		const db = serverDb();
		const { data: group, error: fetchError } = await db
			.from("groups")
			.select("id, name")
			.eq("id", groupId)
			.single();

		if (fetchError || !group) {
			console.error("Error fetching group:", fetchError?.message);
			throw new Error(m.error_creating_group());
		}

		if (group.name.trim().toLowerCase() !== name.trim().toLowerCase()) {
			throw new Error(m.header_delete_group_name_mismatch());
		}

		const { data: expenseRows } = await db
			.from("expenses")
			.select("id")
			.eq("group_id", groupId);
		const expenseIds = expenseRows?.map((r) => r.id) ?? [];
		if (expenseIds.length > 0) {
			await db.from("expense_splits").delete().in("expense_id", expenseIds);
			await db.from("expenses").delete().in("id", expenseIds);
		}
		await db.from("members").delete().eq("group_id", groupId);
		await db.from("group_categories").delete().eq("group_id", groupId);
		const { data: deletedRows, error } = await db
			.from("groups")
			.delete()
			.eq("id", groupId)
			.select("id");
		if (error) {
			console.error("Error deleting group:", error.message);
			throw error;
		}
		if (!deletedRows?.length) {
			// RLS can silently match zero rows; surface it instead of leaving an
			// orphaned group whose children were already removed.
			console.error("Group delete affected no rows (check RLS on groups)");
			throw new Error(m.error_deleting_group());
		}
	});
