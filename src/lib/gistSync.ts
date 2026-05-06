// Cross-device sync via a private GitHub Gist on the user's own account.
// Reuses the GitHub PAT from the vault; needs the 'gist' scope.
// Zero infrastructure on Hangar's side — the user owns the storage.

const GIST_FILENAME = "hangar-config.json";
const GIST_DESCRIPTION = "Hangar — dev tool control tower config (private)";

export interface SyncBlob {
  version: 1;
  syncedAt: string;
  // Mirror of all hangar-* localStorage keys. Per-workspace 'keys' values
  // may be encrypted blobs (we don't try to decrypt during sync).
  workspaces: unknown;
  active: string;
  data: Record<string, Record<string, unknown>>;
}

const HANGAR_KEY_PREFIXES = [
  "hangar-stack",
  "hangar-prefs",
  "hangar-keys",
  "hangar-custom-tools",
  "hangar-frecency",
  "hangar-linkboard",
  "hangar-tool-meta",
] as const;

// Build the sync blob from current localStorage. Iterates all keys to find
// per-workspace entries — workspace ids are unknown without consulting the
// list, but we just sweep prefixes for safety.
export function buildSyncBlob(): SyncBlob {
  const workspaces = JSON.parse(localStorage.getItem("hangar-workspaces") || "[]");
  const active = localStorage.getItem("hangar-active-workspace") || "default";
  const data: SyncBlob["data"] = {};

  // For each prefix, walk localStorage keys looking for `${prefix}-${id}`.
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    for (const prefix of HANGAR_KEY_PREFIXES) {
      const dashed = `${prefix}-`;
      if (key.startsWith(dashed)) {
        const wsId = key.slice(dashed.length);
        const raw = localStorage.getItem(key);
        if (raw == null) continue;
        try {
          if (!data[wsId]) data[wsId] = {};
          data[wsId][prefix] = JSON.parse(raw);
        } catch {
          /* skip malformed */
        }
      }
    }
  }

  return {
    version: 1,
    syncedAt: new Date().toISOString(),
    workspaces,
    active,
    data,
  };
}

// Apply a pulled sync blob to localStorage. Triggers a page reload so all
// hooks rehydrate.
export function applySyncBlob(blob: SyncBlob): void {
  if (!blob || blob.version !== 1) throw new Error("Bad sync blob version");
  localStorage.setItem("hangar-workspaces", JSON.stringify(blob.workspaces ?? []));
  localStorage.setItem("hangar-active-workspace", blob.active || "default");
  for (const [wsId, perWs] of Object.entries(blob.data || {})) {
    for (const [prefix, value] of Object.entries(perWs)) {
      if (HANGAR_KEY_PREFIXES.includes(prefix as (typeof HANGAR_KEY_PREFIXES)[number])) {
        localStorage.setItem(`${prefix}-${wsId}`, JSON.stringify(value));
      }
    }
  }
}

const GH_BASE = "https://api.github.com";

function ghHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

interface GistFileShape {
  filename?: string;
  content?: string;
  raw_url?: string;
}
interface GistShape {
  id: string;
  description: string | null;
  files: Record<string, GistFileShape>;
  updated_at: string;
}

async function ghJson<T>(url: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { ...ghHeaders(token), ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    let detail = "";
    try {
      const body = (await res.json()) as { message?: string };
      if (body.message) detail = ` — ${body.message}`;
    } catch {
      // ignore
    }
    throw new Error(`GitHub: ${res.status} ${res.statusText}${detail}`);
  }
  return (await res.json()) as T;
}

// Find a pre-existing Hangar gist on the user's account (by description), or
// fall back to creating a new one. Used during initial setup.
export async function findOrCreateHangarGist(
  token: string,
  initial: SyncBlob,
): Promise<{ id: string; created: boolean }> {
  const list = await ghJson<GistShape[]>(`${GH_BASE}/gists?per_page=100`, token);
  const existing = list.find(
    (g) => g.description === GIST_DESCRIPTION || GIST_FILENAME in (g.files || {}),
  );
  if (existing) return { id: existing.id, created: false };
  const created = await ghJson<GistShape>(`${GH_BASE}/gists`, token, {
    method: "POST",
    body: JSON.stringify({
      description: GIST_DESCRIPTION,
      public: false,
      files: { [GIST_FILENAME]: { content: JSON.stringify(initial, null, 2) } },
    }),
  });
  return { id: created.id, created: true };
}

export async function pullGist(token: string, gistId: string): Promise<SyncBlob> {
  const gist = await ghJson<GistShape>(`${GH_BASE}/gists/${gistId}`, token);
  const file = gist.files[GIST_FILENAME];
  if (!file?.content) throw new Error(`Gist has no ${GIST_FILENAME}`);
  return JSON.parse(file.content) as SyncBlob;
}

export async function pushGist(token: string, gistId: string, blob: SyncBlob): Promise<void> {
  await ghJson(`${GH_BASE}/gists/${gistId}`, token, {
    method: "PATCH",
    body: JSON.stringify({
      files: { [GIST_FILENAME]: { content: JSON.stringify(blob, null, 2) } },
    }),
  });
}
