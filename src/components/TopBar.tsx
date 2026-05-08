import { useRef } from "react";
import type { ToolMetaMap } from "../hooks/useToolMeta";
import { Icon } from "../lib/icons";
import type { SecretsMap, Tool } from "../types";
import { Brief } from "./Brief";
import { StatusRadar } from "./StatusRadar";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

interface Props {
  query: string;
  setQuery: (q: string) => void;
  view: "grid" | "list";
  setView: (v: "grid" | "list") => void;
  stackCount: number;
  compareCount: number;
  onOpenStack: () => void;
  onOpenCompare: () => void;
  // Brief + Ask both pull from secrets and stack data.
  stackTools: Tool[];
  toolMeta: ToolMetaMap;
  secrets: SecretsMap;
  onOpenAnthropicKey: () => void;
  onOpenAsk: () => void;
}

export function TopBar({
  query, setQuery,
  view, setView,
  stackCount, compareCount,
  onOpenStack, onOpenCompare,
  stackTools, toolMeta, secrets, onOpenAnthropicKey, onOpenAsk,
}: Props) {
  const searchRef = useRef<HTMLInputElement>(null);

  // ⌘K is now handled at the app level (opens the command palette). This
  // ref is kept so the search box can still be programmatically focused
  // from elsewhere if we ever need it.
  void searchRef;

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="logo">
          <svg viewBox="0 0 32 32" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M4 24 16 6l12 18M4 24h24M9 24v-6h14v6" />
          </svg>
          <span>Hangar</span>
        </div>
        <WorkspaceSwitcher />
      </div>

      <div className="topbar-center">
        <div className="searchbox">
          <Icon.search />
          <input
            ref={searchRef}
            id="hangar-search"
            type="text"
            placeholder="Search tools, accounts, docs…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd>⌘K</kbd>
        </div>
      </div>

      <div className="topbar-right">
        <Brief
          stackTools={stackTools}
          toolMeta={toolMeta}
          secrets={secrets}
          onAddAnthropicKey={onOpenAnthropicKey}
        />
        <button
          type="button"
          className="ask-trigger"
          onClick={onOpenAsk}
          title="Ask your stack — chat with Claude over your connected tools (⌘⇧A)"
        >
          <span className="ask-trigger-spark">✦</span>
          <span>Ask</span>
        </button>
        <StatusRadar stackTools={stackTools} />
        <button
          type="button"
          className="ghost-btn"
          onClick={onOpenCompare}
          disabled={compareCount < 2}
        >
          <Icon.compare /> <span>Compare</span>
          {compareCount > 0 && <span className="pill">{compareCount}</span>}
        </button>
        <button type="button" className="ghost-btn" onClick={onOpenStack}>
          <Icon.pin filled /> <span>My stack</span> <span className="pill">{stackCount}</span>
        </button>
        <div className="seg">
          <button
            type="button"
            className={view === "grid" ? "on" : ""}
            onClick={() => setView("grid")}
            title="Grid"
          >
            <Icon.grid />
          </button>
          <button
            type="button"
            className={view === "list" ? "on" : ""}
            onClick={() => setView("list")}
            title="List"
          >
            <Icon.list />
          </button>
        </div>
      </div>
    </header>
  );
}
