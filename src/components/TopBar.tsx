import { useRef } from "react";
import { Icon } from "../lib/icons";
import type { Tool } from "../types";
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
  // Ask + StatusRadar both read from the live stack.
  stackTools: Tool[];
  onOpenAsk: () => void;
  // Mobile-only — toggles the slide-out sidebar drawer. Hidden via CSS on desktop.
  onToggleMobileSidebar: () => void;
  // Desktop sidebar collapse state. When true, the topbar hamburger
  // becomes always-visible (not just mobile) and triggers onExpandSidebar
  // instead of the mobile-drawer toggle. Lets the user un-hide a sidebar
  // they previously collapsed via the side-tools rail button.
  sidebarCollapsed: boolean;
  onExpandSidebar: () => void;
  // Privacy / screensharing mode. Always rendered as a pill in the
  // topbar so the user can flip it on with one click before a screen
  // share, and SEE at a glance whether it's currently active. The
  // pill changes from neutral chrome (off) to amber + soft pulse (on).
  privacyMode: boolean;
  onTogglePrivacyMode: () => void;
}

export function TopBar({
  query, setQuery,
  view, setView,
  stackCount, compareCount,
  onOpenStack, onOpenCompare,
  stackTools, onOpenAsk, onToggleMobileSidebar,
  sidebarCollapsed, onExpandSidebar,
  privacyMode, onTogglePrivacyMode,
}: Props) {
  const searchRef = useRef<HTMLInputElement>(null);

  // ⌘K is now handled at the app level (opens the command palette). This
  // ref is kept so the search box can still be programmatically focused
  // from elsewhere if we ever need it.
  void searchRef;

  return (
    <header className={`topbar${sidebarCollapsed ? " is-sidebar-collapsed" : ""}`}>
      <div className="topbar-left">
        {/* Hamburger doubles as: mobile drawer opener (always shown on
            phone via CSS) AND desktop sidebar expander (forced visible
            via .is-forced when the sidebar is collapsed). Click target
            switches handler based on which state we're in. */}
        <button
          type="button"
          className={`topbar-mobile-toggle${sidebarCollapsed ? " is-forced" : ""}`}
          onClick={sidebarCollapsed ? onExpandSidebar : onToggleMobileSidebar}
          aria-label={sidebarCollapsed ? "Show sidebar" : "Open sidebar menu"}
          title={sidebarCollapsed ? "Show sidebar" : "Open sidebar menu"}
        >
          <Icon.menu />
        </button>
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
        {/* Privacy / screensharing toggle — always visible so the user
            can flip it on before a screen share with one click and SEE
            whether it's currently active. Off state is muted (neutral
            chrome). On state lights up amber with a soft pulse so the
            mode is impossible to miss in peripheral vision (easy to
            forget after the recording ends). Settings → Security has
            a duplicate toggle for users who arrive there first. */}
        <button
          type="button"
          className={`privacy-pill${privacyMode ? " is-active" : ""}`}
          onClick={onTogglePrivacyMode}
          title={
            privacyMode
              ? "Privacy mode is on — click to turn off (⌘⇧P)"
              : "Blur sensitive info — turn on before screen-sharing (⌘⇧P)"
          }
          aria-label={privacyMode ? "Turn off privacy mode" : "Turn on privacy mode"}
          aria-pressed={privacyMode}
        >
          <span className="privacy-pill-dot" aria-hidden="true" />
          <span>Privacy</span>
        </button>
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
