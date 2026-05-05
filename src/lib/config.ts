// Single-file backup of every Hangar localStorage key. Useful for moving
// between machines or before a brave clear-everything moment.

const KEYS = [
  "hangar-stack",
  "hangar-prefs",
  "hangar-keys",
  "hangar-custom-tools",
] as const;

type Key = (typeof KEYS)[number];

interface ExportShape {
  version: 1;
  exportedAt: string;
  data: Partial<Record<Key, unknown>>;
}

export function exportConfig(): ExportShape {
  const data: Partial<Record<Key, unknown>> = {};
  for (const k of KEYS) {
    const raw = localStorage.getItem(k);
    if (raw == null) continue;
    try {
      data[k] = JSON.parse(raw) as unknown;
    } catch {
      // Skip malformed values rather than fail the whole export.
    }
  }
  return { version: 1, exportedAt: new Date().toISOString(), data };
}

export function downloadConfig(filename = "hangar-config.json"): void {
  const json = JSON.stringify(exportConfig(), null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Returns the count of keys that were imported. Throws on shape errors.
export function importConfig(json: string): number {
  const parsed = JSON.parse(json) as Partial<ExportShape>;
  if (!parsed || typeof parsed !== "object" || parsed.version !== 1 || !parsed.data) {
    throw new Error("Not a Hangar config file (missing version 1 or data field).");
  }
  let imported = 0;
  for (const k of KEYS) {
    const value = parsed.data[k];
    if (value === undefined) continue;
    localStorage.setItem(k, JSON.stringify(value));
    imported++;
  }
  return imported;
}

export async function importConfigFromFile(file: File): Promise<number> {
  const text = await file.text();
  return importConfig(text);
}
