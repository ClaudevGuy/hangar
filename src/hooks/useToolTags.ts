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

import { useCallback, useEffect, useRef, useState } from "react";
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

// Cheap structural compare — bails the cross-instance listener loop
// when the freshly-read map matches what's already in state. Mirrors
// useNotes' sameNotes guard. Compares keys + per-tool array contents.
function sameTags(a: ToolTagsMap, b: ToolTagsMap): boolean {
  if (a === b) return true;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    const av = a[key];
    const bv = b[key];
    if (!bv || av.length !== bv.length) return false;
    for (let i = 0; i < av.length; i++) {
      if (av[i] !== bv[i]) return false;
    }
  }
  return true;
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

  // Persist on change + notify peer instances. Two safeguards against the
  // dispatch→listener→setMap feedback loop (same shape as useNotes):
  // (1) skip the very first effect run so opening the app doesn't write
  //     back what we just read; (2) compare the serialization to what's
  //     already in storage and bail before dispatching when nothing
  //     actually changed.
  const isFirstPersist = useRef(true);
  useEffect(() => {
    if (isFirstPersist.current) {
      isFirstPersist.current = false;
      return;
    }
    try {
      const next = JSON.stringify(tagsByTool);
      if (localStorage.getItem(storageKey()) === next) return;
      localStorage.setItem(storageKey(), next);
      window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
    } catch {
      // quota / serialization — silent. Worst case the change doesn't
      // persist; the in-memory state still reflects the user's intent.
    }
  }, [tagsByTool]);

  // Stay in sync with peer instances (same tab via custom event; across
  // tabs via native storage event). Use the structural compare so an
  // event that wouldn't actually change anything doesn't re-trigger
  // the persist effect and spiral.
  useEffect(() => {
    const onChanged = () => {
      const fresh = read();
      setMap((prev) => (sameTags(prev, fresh) ? prev : fresh));
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key !== storageKey()) return;
      const fresh = read();
      setMap((prev) => (sameTags(prev, fresh) ? prev : fresh));
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
