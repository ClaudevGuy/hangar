import { useCallback, useEffect, useState } from "react";
import type { SecretEntry, SecretsMap } from "../types";

const STORAGE_KEY = "hangar-keys";

function read(): SecretsMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: SecretsMap = {};
    for (const [toolId, entries] of Object.entries(parsed as Record<string, unknown>)) {
      if (!Array.isArray(entries)) continue;
      out[toolId] = entries
        .filter((e): e is SecretEntry =>
          !!e && typeof e === "object" &&
          typeof (e as SecretEntry).id === "string" &&
          typeof (e as SecretEntry).label === "string" &&
          typeof (e as SecretEntry).value === "string",
        );
    }
    return out;
  } catch {
    return {};
  }
}

function newId(): string {
  // Short non-cryptographic id is fine — these are local-only.
  return Math.random().toString(36).slice(2, 10);
}

export function useSecrets() {
  const [secrets, setSecrets] = useState<SecretsMap>(read);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(secrets));
  }, [secrets]);

  const upsertKey = useCallback((toolId: string, entry: Omit<SecretEntry, "id"> & { id?: string }) => {
    setSecrets((prev) => {
      const list = prev[toolId] ?? [];
      const id = entry.id ?? newId();
      const idx = list.findIndex((k) => k.id === id);
      const next: SecretEntry = { id, label: entry.label, value: entry.value };
      const newList = idx >= 0
        ? list.map((k, i) => (i === idx ? next : k))
        : [...list, next];
      return { ...prev, [toolId]: newList };
    });
  }, []);

  const removeKey = useCallback((toolId: string, keyId: string) => {
    setSecrets((prev) => {
      const list = prev[toolId];
      if (!list) return prev;
      const newList = list.filter((k) => k.id !== keyId);
      const next = { ...prev };
      if (newList.length === 0) delete next[toolId];
      else next[toolId] = newList;
      return next;
    });
  }, []);

  return { secrets, upsertKey, removeKey } as const;
}
