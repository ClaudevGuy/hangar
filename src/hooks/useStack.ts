import { useEffect, useState } from "react";
import { workspaceKey } from "../lib/workspaces";
import { notifyDataChanged } from "./useGistSync";

// New users start with an empty stack — they pin what they actually use.
const DEFAULT_SEED: string[] = [];

function read(): string[] {
  try {
    const raw = localStorage.getItem(workspaceKey("hangar-stack"));
    if (!raw) return DEFAULT_SEED;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_SEED;
    return parsed.filter((x): x is string => typeof x === "string");
  } catch {
    return DEFAULT_SEED;
  }
}

export function useStack() {
  const [stack, setStack] = useState<string[]>(read);

  useEffect(() => {
    localStorage.setItem(workspaceKey("hangar-stack"), JSON.stringify(stack));
    notifyDataChanged();
  }, [stack]);

  return [stack, setStack] as const;
}
