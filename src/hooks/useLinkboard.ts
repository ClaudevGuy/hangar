import { useCallback, useEffect, useState } from "react";
import { workspaceKey } from "../lib/workspaces";
import type { LinkItem } from "../types";
import { notifyDataChanged } from "./useGistSync";

const storageKey = () => workspaceKey("hangar-linkboard");

function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function read(): LinkItem[] {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is LinkItem =>
        !!x && typeof x === "object" &&
        typeof (x as LinkItem).id === "string" &&
        typeof (x as LinkItem).url === "string" &&
        typeof (x as LinkItem).label === "string",
    );
  } catch {
    return [];
  }
}

export function useLinkboard() {
  const [items, setItems] = useState<LinkItem[]>(read);

  useEffect(() => {
    localStorage.setItem(storageKey(), JSON.stringify(items));
    notifyDataChanged();
  }, [items]);

  const addLink = useCallback((entry: Omit<LinkItem, "id" | "addedAt">) => {
    setItems((prev) => [
      { id: newId(), addedAt: Date.now(), ...entry },
      ...prev,
    ]);
  }, []);

  const removeLink = useCallback((id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setItems([]);
  }, []);

  return { links: items, addLink, removeLink, clearAll } as const;
}
