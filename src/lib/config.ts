// Single-file backup of every Hangar localStorage key. Useful for moving
// between machines or before a brave clear-everything moment.
//
// Internally we reuse the same SyncBlob shape that gistSync.ts uses, so a
// downloaded file and an uploaded Gist are interchangeable.

import { applySyncBlob, buildSyncBlob, type SyncBlob } from "./gistSync";
import { workspaceKey } from "./workspaces";

export function downloadConfig(filename?: string): void {
  const stamp = new Date().toISOString().slice(0, 10);
  const json = JSON.stringify(buildSyncBlob(), null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename ?? `hangar-config-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Older config.ts used `{ version: 1, exportedAt, data: { 'hangar-stack': ... } }`
// with bare un-prefixed keys (pre-workspaces). Detect by absence of `active`.
interface LegacyConfig {
  version: 1;
  exportedAt?: string;
  data: Record<string, unknown>;
}

function isSyncBlob(v: unknown): v is SyncBlob {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return o.version === 1 && typeof o.active === "string" && typeof o.data === "object";
}

function isLegacyConfig(v: unknown): v is LegacyConfig {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return o.version === 1 && typeof o.data === "object" && !("active" in o);
}

// Returns a count meaningful for the success toast — number of workspaces
// imported for the modern format, number of keys for the legacy format.
export function importConfig(json: string): number {
  const parsed = JSON.parse(json) as unknown;

  if (isSyncBlob(parsed)) {
    applySyncBlob(parsed);
    return Object.keys(parsed.data ?? {}).length;
  }

  if (isLegacyConfig(parsed)) {
    // Bare keys → write into the currently-active workspace's namespace.
    let imported = 0;
    for (const [bareKey, value] of Object.entries(parsed.data)) {
      if (value === undefined) continue;
      try {
        const target = workspaceKey(bareKey as Parameters<typeof workspaceKey>[0]);
        localStorage.setItem(target, JSON.stringify(value));
        imported++;
      } catch {
        // Unknown key in legacy file — skip.
      }
    }
    return imported;
  }

  throw new Error("Not a Hangar config file (expected version 1 with a data field).");
}

export async function importConfigFromFile(file: File): Promise<number> {
  const text = await file.text();
  return importConfig(text);
}
