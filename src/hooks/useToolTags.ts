// Per-tool user-defined tags — "api-stack", "marketing", "experimental",
// whatever the user wants. Orthogonal to the built-in category, so a tool
// can be both `Hosting` (built-in) AND tagged `prod-only` (user). Tags are
// per-workspace because a side-project's mental model differs from a job's.
//
// Storage shape: `Record<toolId, string[]>`. Tags are stored lowercased +
// trimmed so that "Marketing" and " marketing " collapse to the same tag —
// avoids the user accidentally having two near-identical tag chips.
//
// Cross-instance React sync: custom event + native StorageEvent, same
// pattern useNotes / useAnthropicLog use.

import { useCallback, useEffect, useState } from "react";
import { workspaceKey } from "../lib/workspaces";

export type ToolTagsMap = Record<string, string[]>;

const CHANGE_EVENT = "hangar-tool-tags-changed";
const storageKey = () => workspaceKey("hangar-tool-tags");

function read(): ToolTagsMap {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: ToolTagsMap = {};
    for (const [toolId, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (!Array.isArray(value)) continue;
      const tags = value.filter((t): t is string => typeof t === "string");
      if (tags.length > 0) out[toolId] = tags;
    }
    return out;
  } catch {
    return {};
  }
}

function write(map: ToolTagsMap): void {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(map));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  } catch {
    // quota / serialization — silent. Worst case the change doesn't
    // persist; the in-memory state still reflects the user's intent.
  }
}

// Tag normaliser — lowercase + trim + collapse internal whitespace +
// strip a few characters that would break the chip rendering. Keeps
// the tag text predictable enough that two near-identical inputs
// fold to the same canonical key.
function normalize(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_\-]/g, "")
    .slice(0, 32);
}

export interface UseToolTagsReturn {
  // Full map — toolId → tags. Reads only; mutations go via the helpers.
  tagsByTool: ToolTagsMap;
  // Tags for a single tool (returns empty array if none).
  tagsFor: (toolId: string) => string[];
  // Sorted list of every unique tag in use across all tools, with the
  // count of tools that carry it. Powers the sidebar's filter chips.
  allTags: { tag: string; count: number }[];
  addTag: (toolId: string, tag: string) => void;
  removeTag: (toolId: string, tag: string) => void;
}

export function useToolTags(): UseToolTagsReturn {
  const [tagsByTool, setMap] = useState<ToolTagsMap>(() => read());

  // Persist on change; broadcast for sibling instances.
  useEffect(() => {
    write(tagsByTool);
  }, [tagsByTool]);

  // Listen for sibling-instance updates (within tab) + cross-tab updates.
  useEffect(() => {
    const onChanged = () => setMap(read());
    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key.startsWith("hangar-tool-tags-")) setMap(read());
    };
    window.addEventListener(CHANGE_EVENT, onChanged);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChanged);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const addTag = useCallback((toolId: string, raw: string) => {
    const tag = normalize(raw);
    if (!tag) return;
    setMap((prev) => {
      const cur = prev[toolId] ?? [];
      if (cur.includes(tag)) return prev;
      return { ...prev, [toolId]: [...cur, tag].sort() };
    });
  }, []);

  const removeTag = useCallback((toolId: string, tag: string) => {
    setMap((prev) => {
      const cur = prev[toolId];
      if (!cur || !cur.includes(tag)) return prev;
      const next = cur.filter((t) => t !== tag);
      const updated = { ...prev };
      if (next.length === 0) delete updated[toolId];
      else updated[toolId] = next;
      return updated;
    });
  }, []);

  const tagsFor = useCallback(
    (toolId: string): string[] => tagsByTool[toolId] ?? [],
    [tagsByTool],
  );

  // Aggregate counts. Cheap to compute; no need to memoise — caller
  // already gets a stable identity until tagsByTool changes.
  const counts = new Map<string, number>();
  for (const tags of Object.values(tagsByTool)) {
    for (const t of tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  const allTags = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag, count]) => ({ tag, count }));

  return { tagsByTool, tagsFor, allTags, addTag, removeTag };
}
