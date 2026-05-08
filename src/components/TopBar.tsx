import { useRef } from "react";
import type { ToolMetaMap } from "../hooks/useToolMeta";
import { Icon } from "../lib/icons";
import type { Prefs, SecretsMap, Tool } from "../types";
import { Brief } from "./Brief";
import { SettingsMenu } from "./SettingsMenu";
import { StatusRadar } from "./StatusRadar";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

import type { VaultState } from "../hooks/useVault";

interface Props {
  query: string;
  setQuery: (q: string) => void;
  view: "grid" | "list";
  setView: (v: "grid" | "list") => void;
  prefs: Prefs;
  setPref: <K extends keyof Prefs>(key: K, value: Prefs[K]) => void;
  stackCount: number;
  compareCount: number;
  keysCount: number;
  vaultState: VaultState;
  onOpenStack: () => void;
  onOpenCompare: () => void;
  onOpenKeys: () => void;
  onSetPassphrase: (p: string) => Promise<void>;
  onChangePassphrase: (current: string, next: string) => Promise<void>;
  onRemovePassphrase: (current: string) => Promise<void>;
  onLock: () => void;
  sync: { status: "off" | "idle" | "syncing" | "error"; lastSyncedAt: number | null; error: string | null };
  hasGitHubToken: boolean;
  onSyncSetUp: () => void;
  onSyncPushNow: () => void;
  onSyncPullNow: () => void;
  onSyncDisconnect: () => void;
  // Drilled through to SettingsMenu's "Export MCP config" button and the
  // Brief popover. Brief also needs the secrets map to read tokens.
  stackTools: Tool[];
  toolMeta: ToolMetaMap;
  secrets: SecretsMap;
  onOpenAnthropicKey: () => void;
  onOpenShare: () => void;
  onOpenRepoScan: () => void;
}

export function TopBar({
  query, setQuery,
  view, setView,
  prefs, setPref,
  stackCount, compareCount, keysCount,
  vaultState,
  onOpenStack, onOpenCompare, onOpenKeys,
  onSetPassphrase, onChangePassphrase, onRemovePassphrase, onLock,
  sync, hasGitHubToken, onSyncSetUp, onSyncPushNow, onSyncPullNow, onSyncDisconnect,
  stackTools, toolMeta, secrets, onOpenAnthropicKey, onOpenShare, onOpenRepoScan,
}: Props) {
  const toggleTheme = () => setPref("theme", prefs.theme === "dark" ? "light" : "dark");
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
        <button
          type="button"
          className={`ghost-btn ${vaultState === "locked" ? "is-locked" : ""}`}
          onClick={onOpenKeys}
          title={vaultState === "locked" ? "Vault locked — click to unlock" : "API keys vault"}
        >
          <Icon.key /> <span>{vaultState === "locked" ? "Locked" : "Keys"}</span>
          {keysCount > 0 && vaultState !== "locked" && <span className="pill">{keysCount}</span>}
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
        <button type="button" className="icon-btn" onClick={toggleTheme} title="Toggle theme">
          {prefs.theme === "dark" ? <Icon.sun /> : <Icon.moon />}
        </button>
        <SettingsMenu
          prefs={prefs}
          setPref={setPref}
          vaultState={vaultState}
          onSetPassphrase={onSetPassphrase}
          onChangePassphrase={onChangePassphrase}
          onRemovePassphrase={onRemovePassphrase}
          onLock={onLock}
          sync={sync}
          hasGitHubToken={hasGitHubToken}
          onSyncSetUp={onSyncSetUp}
          onSyncPushNow={onSyncPushNow}
          onSyncPullNow={onSyncPullNow}
          onSyncDisconnect={onSyncDisconnect}
          stackTools={stackTools}
          toolMeta={toolMeta}
          onOpenShare={onOpenShare}
          onOpenRepoScan={onOpenRepoScan}
        />
      </div>
    </header>
  );
}
