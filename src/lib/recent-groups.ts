import { useSyncExternalStore } from "react";

/**
 * Groups this device has opened, newest first, so people can get back to
 * them without the code. Device-only convenience: it may be empty in a
 * private window, and every read/write tolerates blocked storage.
 */
export type RecentGroup = {
	slug: string;
	name: string;
	kind: "expense" | "split";
	visitedAt: number;
};

const KEY = "spenty:recent-groups:v1";
const MAX = 8;
const EVENT = "spenty:recent-groups";
const EMPTY: RecentGroup[] = [];

let cache: { raw: string | null; value: RecentGroup[] } | null = null;

function read(): RecentGroup[] {
	let raw: string | null = null;
	try {
		raw = localStorage.getItem(KEY);
	} catch {
		return EMPTY;
	}
	// useSyncExternalStore needs a stable snapshot between changes.
	if (cache && cache.raw === raw) return cache.value;
	let value: RecentGroup[] = EMPTY;
	try {
		const parsed = raw ? JSON.parse(raw) : [];
		if (Array.isArray(parsed)) value = parsed;
	} catch {
		value = EMPTY;
	}
	cache = { raw, value };
	return value;
}

function write(groups: RecentGroup[]) {
	try {
		localStorage.setItem(KEY, JSON.stringify(groups.slice(0, MAX)));
	} catch {
		return;
	}
	window.dispatchEvent(new Event(EVENT));
}

export function rememberGroup(group: Omit<RecentGroup, "visitedAt">) {
	const others = read().filter((g) => g.slug !== group.slug);
	write([{ ...group, visitedAt: Date.now() }, ...others]);
}

export function forgetGroup(slug: string) {
	write(read().filter((g) => g.slug !== slug));
}

function subscribe(onChange: () => void) {
	window.addEventListener(EVENT, onChange);
	window.addEventListener("storage", onChange);
	return () => {
		window.removeEventListener(EVENT, onChange);
		window.removeEventListener("storage", onChange);
	};
}

/** Empty on the server and during hydration, then the stored list. */
export function useRecentGroups() {
	return useSyncExternalStore(subscribe, read, () => EMPTY);
}
