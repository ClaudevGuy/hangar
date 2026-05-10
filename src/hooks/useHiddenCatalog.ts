// Per-workspace set of tool IDs the user has hidden from the catalog
// "Browse" list. Hiding doesn't affect pinning, sidebar lists, or stack
// search — just keeps the catalog row from rendering and from counting
// toward category totals. Mirrors useDismissedIncidents shape so any
// callers familiar with that pattern can read this in one glance.

import { useCallback, useEffect, useState } from "react";
import { workspaceKey } from "../lib/workspaces";

const storageKey = () => workspaceKey("hangar-hidden-catalog");

function read(): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}

function write(ids: Set<string>): void {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(Array.from(ids)));
  } catch {
    // Quota / serialization — silent. Worst case the hide doesn't
    // survive a reload; the UI doesn't break either way.
  }
}

export interface UseHiddenCatalogReturn {
  hiddenIds: Set<string>;
  hide: (id: string) => void;
  unhide: (id: string) => void;
  // Bring everything back. Used by the "X hidden · restore" link in the
  // result bar so dismissals aren't a one-way trap.
  restoreAll: () => void;
}

export function useHiddenCatalog(): UseHiddenCatalogReturn {
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => read());

  useEffect(() => {
    write(hiddenIds);
  }, [hiddenIds]);

  const hide = useCallback((id: string) => {
    setHiddenIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const unhide = useCallback((id: string) => {
    setHiddenIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const restoreAll = useCallback(() => {
    setHiddenIds((prev) => (prev.size === 0 ? prev : new Set()));
  }, []);

  return { hiddenIds, hide, unhide, restoreAll };
}
