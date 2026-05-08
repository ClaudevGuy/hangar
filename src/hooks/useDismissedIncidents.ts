// Persistent dismissal state for the Today feed. The user can hide any
// incident locally — useful for stale Vercel failures, low-signal Sentry
// alerts, or anything they don't want as "an item to look at" right now.
//
// Workspace-scoped via the same `workspaceKey` helper the other hooks use.
// Stored as a JSON array of incident IDs; the hook surfaces them as a Set.

import { useCallback, useEffect, useState } from "react";
import { workspaceKey } from "../lib/workspaces";

const storageKey = () => workspaceKey("hangar-today-dismissed");

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
    // Quota / serialization failures: don't block the UI.
  }
}

export interface UseDismissedReturn {
  dismissedIds: Set<string>;
  dismiss: (id: string) => void;
  // Used by the Quick Actions optimistic flow to roll back when the
  // remote write (Sentry resolve, Linear snooze, etc.) fails.
  undismiss: (id: string) => void;
  restoreAll: () => void;
  // Mass-dismiss every id currently shown — used by the Today header's
  // "Clear all" button. The caller passes today's visible ids.
  dismissMany: (ids: string[]) => void;
}

export function useDismissedIncidents(): UseDismissedReturn {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => read());

  // Persist whenever the set changes.
  useEffect(() => {
    write(dismissedIds);
  }, [dismissedIds]);

  const dismiss = useCallback((id: string) => {
    setDismissedIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const undismiss = useCallback((id: string) => {
    setDismissedIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const dismissMany = useCallback((ids: string[]) => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      let changed = false;
      for (const id of ids) {
        if (!next.has(id)) {
          next.add(id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, []);

  const restoreAll = useCallback(() => {
    setDismissedIds((prev) => (prev.size === 0 ? prev : new Set()));
  }, []);

  return { dismissedIds, dismiss, undismiss, dismissMany, restoreAll };
}
