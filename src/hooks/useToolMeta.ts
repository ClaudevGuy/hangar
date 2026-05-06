import { useCallback, useEffect, useState } from "react";
import { workspaceKey } from "../lib/workspaces";
import { notifyDataChanged } from "./useGistSync";

// Per-tool user state that doesn't belong on the Tool itself: which plan the
// user is actually on (for real cost stats) and when they last launched it
// (for "you opened Vercel 2h ago" prompts in the launcher).
export interface ToolMeta {
  plan?: string;
  lastOpenedAt?: number;
}

export type ToolMetaMap = Record<string, ToolMeta>;

const storageKey = () => workspaceKey("hangar-tool-meta");

function read(): ToolMetaMap {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as ToolMetaMap;
  } catch {
    return {};
  }
}

export function useToolMeta() {
  const [meta, setMeta] = useState<ToolMetaMap>(read);

  useEffect(() => {
    localStorage.setItem(storageKey(), JSON.stringify(meta));
    notifyDataChanged();
  }, [meta]);

  // Pass plan="" or null to clear. We deliberately leave behind an empty entry
  // when only one field is set — JSON.stringify drops `undefined` so the
  // persisted shape stays clean.
  const setPlan = useCallback((toolId: string, plan: string | null) => {
    setMeta((prev) => ({
      ...prev,
      [toolId]: { ...(prev[toolId] ?? {}), plan: plan || undefined },
    }));
  }, []);

  const recordOpened = useCallback((toolId: string) => {
    setMeta((prev) => ({
      ...prev,
      [toolId]: { ...(prev[toolId] ?? {}), lastOpenedAt: Date.now() },
    }));
  }, []);

  return { meta, setPlan, recordOpened } as const;
}
