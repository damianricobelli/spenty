const KEY = "spenty-unlocked-groups";

function getIds(): Set<string> {
  if (typeof sessionStorage === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function persist(ids: Set<string>) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify([...ids]));
  } catch {
    // ignore
  }
}

export function isGroupUnlocked(groupId: string): boolean {
  return getIds().has(groupId);
}

export function setGroupUnlocked(groupId: string, unlocked: boolean): void {
  const ids = getIds();
  if (unlocked) ids.add(groupId);
  else ids.delete(groupId);
  persist(ids);
}
