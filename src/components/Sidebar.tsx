import { ACTIVITY, CATEGORIES, TOOLS } from "../data/tools";
import type { ToolMetaMap } from "../hooks/useToolMeta";
import type { VaultState } from "../hooks/useVault";
import { Icon } from "../lib/icons";
import { timeAgo } from "../lib/timeAgo";
import type { CategoryId, LinkItem, Prefs, Tool } from "../types";
import { Linkboard } from "./Linkboard";
import { SettingsMenu } from "./SettingsMenu";
import { ToolLogo } from "./ToolLogo";

interface SyncStateForUI {
  status: "off" | "idle" | "syncing" | "error";
  lastSyncedAt: number | null;
  error: string | null;
}

interface Props {
  active: CategoryId;
  setActive: (id: CategoryId) => void;
  counts: Partial<Record<CategoryId, number>>;
  stackTools: Tool[];
  customTools: Tool[];
  toolMeta: ToolMetaMap;
  onRemoveStack: (id: string) => void;
  onOpenTool: (tool: Tool) => void;
  onOpenStarters: () => void;
  // Linkboard props
  links: LinkItem[];
  onAddLink: (entry: Omit<LinkItem, "id" | "addedAt">) => void;
  onRemoveLink: (id: string) => void;
  onClearLinks: () => void;
  // Sticky tools rail at the bottom — theme toggle, settings menu, keys vault.
  // Drilled down from HangarApp so each tool can stay where it logically lives.
  prefs: Prefs;
  setPref: <K extends keyof Prefs>(key: K, value: Prefs[K]) => void;
  vaultState: VaultState;
  keysCount: number;
  onOpenKeys: () => void;
  onSetPassphrase: (p: string) => Promise<void>;
  onChangePassphrase: (current: string, next: string) => Promise<void>;
  onRemovePassphrase: (current: string) => Promise<void>;
  onLock: () => void;
  sync: SyncStateForUI;
  hasGitHubToken: boolean;
  onSyncSetUp: () => void;
  onSyncPushNow: () => void;
  onSyncPullNow: () => void;
  onSyncDisconnect: () => void;
  // SettingsMenu drilled-through props (Data tab)
  onOpenShare: () => void;
  onOpenRepoScan: () => void;
  // Mobile drawer state. On desktop the sidebar is always visible; on
  // mobile it slides in from the left when isMobileOpen flips true,
  // and any nav action (category click, tool click) closes it.
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  // Desktop collapse — when true, the sidebar slides to width 0 (CSS
  // handles the animation). The expand affordance lives on the topbar
  // hamburger, which becomes always-visible when collapsed=true.
  collapsed: boolean;
  onCollapse: () => void;
}

export function Sidebar({
  active, setActive, counts, stackTools, customTools, toolMeta, onRemoveStack, onOpenTool, onOpenStarters,
  links, onAddLink, onRemoveLink, onClearLinks,
  prefs, setPref, vaultState, keysCount, onOpenKeys,
  onSetPassphrase, onChangePassphrase, onRemovePassphrase, onLock,
  sync, hasGitHubToken, onSyncSetUp, onSyncPushNow, onSyncPullNow, onSyncDisconnect,
  onOpenShare, onOpenRepoScan,
  isMobileOpen, onCloseMobile,
  collapsed, onCollapse,
}: Props) {
  const toggleTheme = () => setPref("theme", prefs.theme === "dark" ? "light" : "dark");

  // On mobile, any navigation action collapses the drawer so the user
  // sees the result immediately. On desktop these helpers are no-ops
  // because onCloseMobile() does nothing when isMobileOpen is false.
  const pickCategory = (id: CategoryId) => {
    setActive(id);
    onCloseMobile();
  };
  const openTool = (tool: Tool) => {
    onOpenTool(tool);
    onCloseMobile();
  };

  return (
    <aside
      className={`sidebar${isMobileOpen ? " is-mobile-open" : ""}${collapsed ? " is-collapsed" : ""}`}
      aria-hidden={collapsed ? true : undefined}
    >
      <Linkboard
        links={links}
        builtInTools={TOOLS}
        customTools={customTools}
        onAdd={onAddLink}
        onRemove={onRemoveLink}
        onClear={onClearLinks}
      />

      <div className="side-section">
        <div className="side-label">Categories</div>
        <nav className="cat-nav">
          {CATEGORIES.map((c) => (
            <button
              type="button"
              key={c.id}
              className={`cat-btn ${active === c.id ? "active" : ""}`}
              onClick={() => pickCategory(c.id)}
            >
              <span className="cat-icon">{c.icon}</span>
              <span className="cat-name">{c.name}</span>
              <span className="cat-count">{counts[c.id] ?? 0}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="side-section">
        <div className="side-label">
          My stack <span className="lbl-count">{stackTools.length}</span>
        </div>
        {stackTools.length === 0 ? (
          <div className="empty-stack empty-stack-cta">
            <span>
              <Icon.pin /> Pin tools you actually use to build your stack — or jumpstart with a starter.
            </span>
            <button type="button" className="primary-btn small" onClick={onOpenStarters}>
              Try a starter stack
            </button>
          </div>
        ) : (
          <ul className="stack-list">
            {stackTools.map((t) => {
              const m = toolMeta[t.id];
              const plan = m?.plan ?? t.plan;
              const lastOpenedAt = m?.lastOpenedAt;
              const metaParts: string[] = [t.category];
              if (plan) metaParts.push(plan);
              if (lastOpenedAt) metaParts.push(timeAgo(lastOpenedAt));
              return (
              <li key={t.id} className="stack-item">
                <button type="button" className="stack-main" onClick={() => openTool(t)}>
                  <ToolLogo tool={t} size={26} />
                  <div className="stack-meta">
                    <div className="stack-name">{t.name}</div>
                    <div className="stack-cat">{metaParts.join(" · ")}</div>
                  </div>
                  {t.status === "live" && <span className="status-dot" title="Live" />}
                </button>
                <button
                  type="button"
                  className="stack-x"
                  onClick={() => onRemoveStack(t.id)}
                  title="Unpin"
                >
                  <Icon.close />
                </button>
              </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Activity feed (when present) sits as a regular flex item — no
          longer wrapped with the tools rail. Its old margin-top: auto is
          dropped (see styles.css) since the tools rail now owns the
          bottom anchor. */}
      {ACTIVITY.length > 0 && (
        <div className="side-section side-foot">
          <div className="side-label">Activity</div>
          <ul className="activity">
            {ACTIVITY.slice(0, 5).map((a, i) => {
              const tool = TOOLS.find((t) => t.id === a.tool);
              return (
                <li key={i}>
                  {tool && <ToolLogo tool={tool} size={18} />}
                  <div className="act-text">
                    <span className="act-line">{a.text}</span>
                    {a.repo && <span className="act-repo">{a.repo}</span>}
                  </div>
                  <span className="act-time">{a.time}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Sticky tools rail — theme · settings · keys vault. Now a direct
          child of the sidebar so its containing block IS the scroll
          container; position: sticky bottom: 0 then engages all the way
          up the scroll, not just when the wrapper itself happens to be
          in view. */}
      <div className="side-tools">
        <button
          type="button"
          className="side-tool-btn"
          onClick={toggleTheme}
          title={prefs.theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          aria-label="Toggle theme"
        >
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
          placement="sidebar"
        />
        <button
          type="button"
          className={`side-tool-btn side-tool-keys ${vaultState === "locked" ? "is-locked" : ""}`}
          onClick={onOpenKeys}
          title={vaultState === "locked" ? "Vault locked — click to unlock" : "API keys vault"}
          aria-label="Open keys vault"
        >
          <Icon.key />
          {keysCount > 0 && vaultState !== "locked" && (
            <span className="side-tool-count">{keysCount}</span>
          )}
        </button>
        {/* Collapse the sidebar — slides it to width 0. The topbar
            hamburger becomes always-visible while collapsed so the
            user has a way to bring it back. */}
        <button
          type="button"
          className="side-tool-btn side-tool-collapse"
          onClick={onCollapse}
          title="Hide sidebar"
          aria-label="Hide sidebar"
        >
          <Icon.sidebarCollapse />
        </button>
      </div>
    </aside>
  );
}
