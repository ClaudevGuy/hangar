// Workspace management. Each workspace gets its own copy of the
// stack / prefs / keys / custom-tools data, partitioned by id suffix.
// Switching workspaces reloads the page so all hooks rehydrate cleanly.

export interface Workspace {
  id: string;
  name: string;
  emoji: string;
}

const LIST_KEY = "hangar-workspaces";
const ACTIVE_KEY = "hangar-active-workspace";

const DEFAULT_WORKSPACE: Workspace = { id: "default", name: "Personal", emoji: "🏠" };

// Per-workspace localStorage prefixes — same names the original hooks use,
// just with the workspace id appended.
const WORKSPACE_KEYS = [
  "hangar-stack",
  "hangar-prefs",
  "hangar-keys",
  "hangar-custom-tools",
  "hangar-linkboard",
  "hangar-frecency",
  "hangar-tool-meta",
  "hangar-ask-history",
] as const;

function readList(): Workspace[] {
  try {
    const raw = localStorage.getItem(LIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (w): w is Workspace =>
        !!w && typeof w === "object" &&
        typeof (w as Workspace).id === "string" &&
        typeof (w as Workspace).name === "string",
    );
  } catch {
    return [];
  }
}

function writeList(list: Workspace[]) {
  localStorage.setItem(LIST_KEY, JSON.stringify(list));
}

// Migrate the legacy un-suffixed keys into the default workspace on first run.
// Runs once: if `hangar-workspaces` is empty AND any legacy key exists, copy
// it over to the default-workspace key and leave the legacy key as a backup.
function migrateLegacyData(): void {
  const list = readList();
  if (list.length > 0) return;
  const defaultList: Workspace[] = [DEFAULT_WORKSPACE];
  for (const key of WORKSPACE_KEYS) {
    const legacy = localStorage.getItem(key);
    if (legacy != null) {
      const newKey = `${key}-${DEFAULT_WORKSPACE.id}`;
      if (localStorage.getItem(newKey) == null) {
        localStorage.setItem(newKey, legacy);
      }
    }
  }
  writeList(defaultList);
  localStorage.setItem(ACTIVE_KEY, DEFAULT_WORKSPACE.id);
}

migrateLegacyData();

export function listWorkspaces(): Workspace[] {
  const list = readList();
  if (list.length === 0) {
    writeList([DEFAULT_WORKSPACE]);
    return [DEFAULT_WORKSPACE];
  }
  return list;
}

export function getActiveWorkspaceId(): string {
  const id = localStorage.getItem(ACTIVE_KEY);
  if (id && readList().some((w) => w.id === id)) return id;
  return DEFAULT_WORKSPACE.id;
}

export function setActiveWorkspaceId(id: string): void {
  localStorage.setItem(ACTIVE_KEY, id);
}

export function createWorkspace(name: string, emoji = "📁"): Workspace {
  const id = `ws_${Math.random().toString(36).slice(2, 8)}`;
  const ws: Workspace = { id, name, emoji };
  writeList([...readList(), ws]);
  return ws;
}

export function renameWorkspace(id: string, name: string, emoji?: string): void {
  writeList(
    readList().map((w) => (w.id === id ? { ...w, name, emoji: emoji ?? w.emoji } : w)),
  );
}

export function removeWorkspace(id: string): void {
  const list = readList().filter((w) => w.id !== id);
  if (list.length === 0) list.push(DEFAULT_WORKSPACE);
  writeList(list);
  // Drop the workspace's data so reused-name doesn't inherit ghosts.
  for (const key of WORKSPACE_KEYS) {
    localStorage.removeItem(`${key}-${id}`);
  }
  if (getActiveWorkspaceId() === id) {
    setActiveWorkspaceId(list[0].id);
  }
}

// Helper: per-workspace storage key. Each persistence hook calls this to
// scope its key to the active workspace.
export function workspaceKey(prefix: (typeof WORKSPACE_KEYS)[number]): string {
  return `${prefix}-${getActiveWorkspaceId()}`;
}
