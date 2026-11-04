import { createServerFn } from "@tanstack/react-start";
import { assertGroupAccess } from "@/lib/group-access.server";
import { serverDb } from "@/lib/supabase/server";
import {
	CreateGroupCategorySchema,
	DeleteGroupCategorySchema,
	GroupSchema,
} from "./schema";

const capitalizeFirstLetter = (value: string) =>
	value.charAt(0).toUpperCase() + value.slice(1);

export const getGroupCategories = createServerFn({
	method: "GET",
})
	.validator(GroupSchema)
	.handler(
		async ({ data: { groupId } }): Promise<{ id: string; name: string }[]> => {
			await assertGroupAccess(groupId);
			const { data, error } = await serverDb()
				.from("group_categories")
				.select("id, name")
				.eq("group_id", groupId)
				.order("name", { ascending: true });

			if (error) {
				console.error("Error fetching group categories:", error.message);
				throw error;
			}
			return (data ?? []) as { id: string; name: string }[];
		},
	);

export const createGroupCategory = createServerFn({
	method: "POST",
})
	.validator(CreateGroupCategorySchema)
	.handler(async ({ data: { groupId, name } }) => {
		await assertGroupAccess(groupId);
		const db = serverDb();
		const trimmed = name.trim();
		const normalizedName = capitalizeFirstLetter(trimmed);
		const { data: existing } = await db
			.from("group_categories")
			.select("id, name")
			.eq("group_id", groupId)
			.ilike("name", normalizedName)
			.maybeSingle();

		if (existing) {
			return existing;
		}

		const { data, error } = await db
			.from("group_categories")
			.insert({ group_id: groupId, name: normalizedName })
			.select("id, name")
			.single();

		if (error) {
			console.error("Error creating group category:", error.message);
			throw error;
		}
		return data;
	});

export const deleteGroupCategory = createServerFn({
	method: "POST",
})
	.validator(DeleteGroupCategorySchema)
	.handler(async ({ data: { groupId, categoryId } }) => {
		await assertGroupAccess(groupId);
		const { error } = await serverDb()
			.from("group_categories")
			.delete()
			.eq("id", categoryId)
			.eq("group_id", groupId);

		if (error) {
			console.error("Error deleting group category:", error.message);
			throw error;
		}
	});
