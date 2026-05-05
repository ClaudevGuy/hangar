import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../lib/icons";
import { frecencyScore, type FrecencyMap } from "../hooks/useFrecency";
import type { Tool } from "../types";
import { ToolLogo } from "./ToolLogo";

type ItemKind = "tool" | "action";

interface PaletteItem {
  kind: ItemKind;
  id: string;
  // Tool-only: the underlying Tool object.
  tool?: Tool;
  // Common: visible label and a hint shown on the right.
  label: string;
  hint: string;
  // Search-friendly haystack.
  search: string;
  // What to do on Enter.
  perform: () => void;
}

interface Props {
  tools: Tool[];
  stack: string[];
  frecency: FrecencyMap;
  onLaunchTool: (tool: Tool) => void;
  onOpenTool: (tool: Tool) => void;
  onPinTool: (tool: Tool) => void;
  onClose: () => void;
  onOpenStarters: () => void;
  onOpenAddTool: () => void;
  onOpenKeys: () => void;
  onOpenStack: () => void;
}

// Lightweight subsequence-aware fuzzy score. Higher is better; 0 = no match.
function fuzzyScore(query: string, haystack: string): number {
  if (!query) return 1;
  const q = query.toLowerCase();
  const h = haystack.toLowerCase();
  if (h.includes(q)) {
    // Exact substring → big bonus, prefix is best.
    return h.startsWith(q) ? 1000 : 500 + (200 - h.indexOf(q));
  }
  // Subsequence fallback.
  let qi = 0;
  let score = 0;
  let lastMatch = -1;
  for (let i = 0; i < h.length && qi < q.length; i++) {
    if (h[i] === q[qi]) {
      // Reward consecutive matches.
      if (lastMatch === i - 1) score += 5;
      else score += 1;
      lastMatch = i;
      qi++;
    }
  }
  return qi === q.length ? score : 0;
}

export function CommandPalette({
  tools, stack, frecency,
  onLaunchTool, onOpenTool, onPinTool,
  onClose, onOpenStarters, onOpenAddTool, onOpenKeys, onOpenStack,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Build the candidate list: tools + a few app-level actions.
  const items = useMemo<PaletteItem[]>(() => {
    const toolItems: PaletteItem[] = tools.map((t) => ({
      kind: "tool",
      id: t.id,
      tool: t,
      label: t.name,
      hint: t.category,
      search: `${t.name} ${t.tagline} ${t.category}`,
      perform: () => onLaunchTool(t),
    }));
    const actions: PaletteItem[] = [
      {
        kind: "action",
        id: "act-starters",
        label: "Browse starter stacks",
        hint: "Action",
        search: "starter stacks templates seed",
        perform: onOpenStarters,
      },
      {
        kind: "action",
        id: "act-add-tool",
        label: "Add a custom tool",
        hint: "Action",
        search: "add custom tool new",
        perform: onOpenAddTool,
      },
      {
        kind: "action",
        id: "act-keys",
        label: "Open keys vault",
        hint: "Action",
        search: "keys vault api tokens secrets",
        perform: onOpenKeys,
      },
      {
        kind: "action",
        id: "act-stack",
        label: "Open my stack",
        hint: "Action",
        search: "stack my pinned tools",
        perform: onOpenStack,
      },
    ];
    return [...toolItems, ...actions];
  }, [tools, onLaunchTool, onOpenStarters, onOpenAddTool, onOpenKeys, onOpenStack]);

  const ranked = useMemo(() => {
    const q = query.trim();
    if (!q) {
      // No query: pinned tools by frecency, then unpinned by frecency, then actions.
      const pinned = items.filter((it) => it.kind === "tool" && stack.includes(it.id));
      const unpinned = items.filter((it) => it.kind === "tool" && !stack.includes(it.id));
      const actions = items.filter((it) => it.kind === "action");
      const sortByFrecency = (a: PaletteItem, b: PaletteItem) =>
        frecencyScore(frecency[b.id]) - frecencyScore(frecency[a.id]);
      pinned.sort(sortByFrecency);
      unpinned.sort(sortByFrecency);
      return [...pinned, ...unpinned.slice(0, 8), ...actions];
    }
    const scored = items
      .map((it) => {
        const base = fuzzyScore(q, it.search);
        if (base === 0) return null;
        const fb = frecencyScore(frecency[it.id]);
        const pinnedBonus = it.kind === "tool" && stack.includes(it.id) ? 50 : 0;
        return { it, score: base + fb + pinnedBonus };
      })
      .filter((x): x is { it: PaletteItem; score: number } => x !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map((x) => x.it);
    return scored;
  }, [items, query, frecency, stack]);

  // Reset cursor when the result list changes.
  useEffect(() => {
    setActiveIdx(0);
  }, [query, ranked.length]);

  const choose = (idx: number, modifierOpenInsteadOfLaunch: boolean) => {
    const item = ranked[idx];
    if (!item) return;
    onClose();
    if (item.kind === "tool" && item.tool) {
      if (modifierOpenInsteadOfLaunch) {
        onOpenTool(item.tool);
      } else {
        item.perform();
      }
    } else {
      item.perform();
    }
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(ranked.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      // Cmd/Ctrl + Enter → open the drawer instead of launching the dashboard.
      const openDrawer = e.metaKey || e.ctrlKey;
      choose(activeIdx, openDrawer);
    } else if (e.key === "p" && (e.metaKey || e.ctrlKey)) {
      // Cmd/Ctrl + P inside palette → pin/unpin the highlighted tool.
      const item = ranked[activeIdx];
      if (item?.kind === "tool" && item.tool) {
        e.preventDefault();
        onPinTool(item.tool);
      }
    }
  };

  return (
    <div className="modal-overlay palette-overlay" onClick={onClose}>
      <div className="palette" onClick={(e) => e.stopPropagation()}>
        <div className="palette-input-wrap">
          <Icon.search />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search tools and actions… (↵ launch · ⌘↵ open drawer · ⌘P pin)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <kbd>esc</kbd>
        </div>
        <ul className="palette-list">
          {ranked.length === 0 && (
            <li className="palette-empty muted">No matches.</li>
          )}
          {ranked.map((item, i) => (
            <li
              key={item.id}
              className={`palette-item ${i === activeIdx ? "active" : ""}`}
              onMouseEnter={() => setActiveIdx(i)}
              onClick={() => choose(i, false)}
            >
              {item.kind === "tool" && item.tool ? (
                <ToolLogo tool={item.tool} size={22} />
              ) : (
                <span className="palette-icon" aria-hidden="true">⌘</span>
              )}
              <div className="palette-meta">
                <div className="palette-label">{item.label}</div>
                {item.kind === "tool" && item.tool && (
                  <div className="palette-sub">{item.tool.tagline}</div>
                )}
              </div>
              <span className="palette-hint">
                {item.kind === "tool" && stack.includes(item.id) ? "Pinned · " : ""}
                {item.hint}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
