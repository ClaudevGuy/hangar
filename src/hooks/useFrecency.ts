import { useCallback, useEffect, useState } from "react";
import { workspaceKey } from "../lib/workspaces";

// Per-tool counter + last-used timestamp, used by the command palette to
// rank "tools you actually use" above the rest.
export interface FrecencyEntry {
  count: number;
  lastUsed: number;
}

export type FrecencyMap = Record<string, FrecencyEntry>;

const storageKey = () => workspaceKey("hangar-frecency");

function read(): FrecencyMap {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as FrecencyMap;
  } catch {
    return {};
  }
}

export function useFrecency() {
  const [frecency, setFrecency] = useState<FrecencyMap>(read);

  useEffect(() => {
    localStorage.setItem(storageKey(), JSON.stringify(frecency));
  }, [frecency]);

  const record = useCallback((toolId: string) => {
    setFrecency((prev) => {
      const cur = prev[toolId] ?? { count: 0, lastUsed: 0 };
      return { ...prev, [toolId]: { count: cur.count + 1, lastUsed: Date.now() } };
    });
  }, []);

  return { frecency, record };
}

// Higher = better rank. Recency decays over ~14 days.
export function frecencyScore(entry: FrecencyEntry | undefined): number {
  if (!entry) return 0;
  const days = (Date.now() - entry.lastUsed) / (1000 * 60 * 60 * 24);
  const recency = Math.max(0, 14 - days) / 14; // 1.0 → 0
  return entry.count * (1 + recency);
}
