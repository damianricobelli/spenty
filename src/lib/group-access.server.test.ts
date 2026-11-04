import { beforeEach, describe, expect, it, vi } from "vitest";

// In-memory stand-in for the request/response cookie helpers.
const cookies = new Map<string, string>();
vi.mock("@tanstack/react-start/server", () => ({
	getCookie: (name: string) => cookies.get(name),
	setCookie: (name: string, value: string) => cookies.set(name, value),
	deleteCookie: (name: string) => cookies.delete(name),
}));
vi.mock("@/lib/supabase/server", () => ({ serverDb: vi.fn() }));
vi.mock("@/paraglide/messages", () => ({
	m: new Proxy({}, { get: (_, key) => () => String(key) }),
}));

const {
	grantGroupAccess,
	hasGroupAccess,
	hashPassword,
	revokeGroupAccess,
	verifyPassword,
} = await import("./group-access.server");

const GROUP = "44444444-4444-4444-8444-444444444444";
const OTHER_GROUP = "55555555-5555-4555-8555-555555555555";

beforeEach(() => cookies.clear());

describe("password hashing", () => {
	it("never stores the plain password and verifies the right one", async () => {
		const hash = await hashPassword("hunter2");
		expect(hash).not.toContain("hunter2");
		expect(hash.startsWith("scrypt$")).toBe(true);
		expect(await verifyPassword("hunter2", hash)).toBe(true);
		expect(await verifyPassword(" hunter2 ", hash)).toBe(true);
		expect(await verifyPassword("hunter3", hash)).toBe(false);
	});

	it("salts every hash", async () => {
		expect(await hashPassword("same")).not.toBe(await hashPassword("same"));
	});

	it("still accepts legacy plaintext passwords", async () => {
		expect(await verifyPassword("old-pass", "old-pass")).toBe(true);
		expect(await verifyPassword("wrong", "old-pass")).toBe(false);
	});
});

describe("unlock cookie", () => {
	it("lets anyone into a group without a password", () => {
		expect(hasGroupAccess(GROUP, null)).toBe(true);
	});

	it("keeps a protected group locked until access is granted", async () => {
		const hash = await hashPassword("secret");
		expect(hasGroupAccess(GROUP, hash)).toBe(false);
		grantGroupAccess(GROUP, hash);
		expect(hasGroupAccess(GROUP, hash)).toBe(true);
	});

	it("doesn't unlock other groups with the same cookie value", async () => {
		const hash = await hashPassword("secret");
		grantGroupAccess(GROUP, hash);
		const value = cookies.get(`spenty_unlock_${GROUP}`) ?? "";
		cookies.set(`spenty_unlock_${OTHER_GROUP}`, value);
		expect(hasGroupAccess(OTHER_GROUP, hash)).toBe(false);
	});

	it("stops working when the password changes or is revoked", async () => {
		const oldHash = await hashPassword("secret");
		grantGroupAccess(GROUP, oldHash);
		const newHash = await hashPassword("secret");
		expect(hasGroupAccess(GROUP, newHash)).toBe(false);

		grantGroupAccess(GROUP, newHash);
		revokeGroupAccess(GROUP);
		expect(hasGroupAccess(GROUP, newHash)).toBe(false);
	});

	it("rejects a forged cookie", async () => {
		const hash = await hashPassword("secret");
		cookies.set(`spenty_unlock_${GROUP}`, "forged");
		expect(hasGroupAccess(GROUP, hash)).toBe(false);
	});
});
