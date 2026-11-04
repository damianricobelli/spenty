import {
	createHmac,
	randomBytes,
	scrypt as scryptCallback,
	timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";
import { serverDb } from "@/lib/supabase/server";
import { m } from "@/paraglide/messages";

/**
 * Server-only access control for password-protected groups.
 *
 * - Passwords are stored as scrypt hashes. Groups created before hashing
 *   still hold plaintext; those are accepted once and upgraded on unlock.
 * - Unlocking sets an httpOnly cookie per group. Its value is an HMAC of the
 *   group id keyed with the stored hash, so it can't be forged without the
 *   hash (which never leaves the server) and every cookie stops working as
 *   soon as the password changes or is removed.
 */

const scrypt = promisify(scryptCallback) as (
	password: string,
	salt: Buffer,
	keylen: number,
) => Promise<Buffer>;

const HASH_PREFIX = "scrypt";
const KEY_LENGTH = 64;
const UNLOCK_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export async function hashPassword(plain: string): Promise<string> {
	const salt = randomBytes(16);
	const hash = await scrypt(plain.trim(), salt, KEY_LENGTH);
	return `${HASH_PREFIX}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

function isHashed(stored: string) {
	return stored.startsWith(`${HASH_PREFIX}$`);
}

function safeEqual(a: Buffer, b: Buffer) {
	return a.length === b.length && timingSafeEqual(a, b);
}

export async function verifyPassword(
	plain: string,
	stored: string,
): Promise<boolean> {
	if (!isHashed(stored)) {
		return safeEqual(Buffer.from(plain.trim()), Buffer.from(stored.trim()));
	}
	const [, saltB64, hashB64] = stored.split("$");
	if (!saltB64 || !hashB64) return false;
	const expected = Buffer.from(hashB64, "base64");
	const actual = await scrypt(
		plain.trim(),
		Buffer.from(saltB64, "base64"),
		expected.length,
	);
	return safeEqual(actual, expected);
}

function cookieName(groupId: string) {
	return `spenty_unlock_${groupId}`;
}

function unlockToken(groupId: string, storedHash: string) {
	return createHmac("sha256", storedHash).update(groupId).digest("base64url");
}

export function grantGroupAccess(groupId: string, storedHash: string) {
	setCookie(cookieName(groupId), unlockToken(groupId, storedHash), {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		path: "/",
		maxAge: UNLOCK_MAX_AGE_SECONDS,
	});
}

export function revokeGroupAccess(groupId: string) {
	deleteCookie(cookieName(groupId), { path: "/" });
}

/** True when the group has no password or this request carries a valid unlock cookie. */
export function hasGroupAccess(groupId: string, storedPassword: string | null) {
	if (!storedPassword) return true;
	const cookie = getCookie(cookieName(groupId));
	if (!cookie) return false;
	return safeEqual(
		Buffer.from(cookie),
		Buffer.from(unlockToken(groupId, storedPassword)),
	);
}

export async function getStoredPassword(groupId: string) {
	const { data, error } = await serverDb()
		.from("groups")
		.select("password")
		.eq("id", groupId)
		.single();
	if (error || !data) {
		throw new Error(m.home_page_search_code_not_found());
	}
	return data.password;
}

/**
 * Call at the top of every server function that reads or changes a group's
 * data. Throws when the group is password-protected and still locked.
 */
export async function assertGroupAccess(groupId: string) {
	const stored = await getStoredPassword(groupId);
	if (!hasGroupAccess(groupId, stored)) {
		throw new Error(m.password_unlock_description());
	}
}
