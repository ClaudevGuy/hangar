import { useEffect, useRef } from "react";
import { Icon } from "../lib/icons";
import type { Prefs } from "../types";
import { SettingsMenu } from "./SettingsMenu";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

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
  onOpenStack: () => void;
  onOpenCompare: () => void;
  onOpenKeys: () => void;
}

export function TopBar({
  query, setQuery,
  view, setView,
  prefs, setPref,
  stackCount, compareCount, keysCount,
  onOpenStack, onOpenCompare, onOpenKeys,
}: Props) {
  const toggleTheme = () => setPref("theme", prefs.theme === "dark" ? "light" : "dark");
  const searchRef = useRef<HTMLInputElement>(null);

  // ⌘K (Mac) or Ctrl+K (Windows/Linux) → focus the search box.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        const tag = (document.activeElement?.tagName || "").toLowerCase();
        // Don't steal the shortcut from native browser-text fields the user
        // has explicitly focused; but otherwise always grab it.
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
        // tag check is purely informative — we always want the shortcut to win.
        void tag;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
            type="text"
            placeholder="Search tools, accounts, docs…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd>⌘K</kbd>
        </div>
      </div>

      <div className="topbar-right">
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
        <button type="button" className="ghost-btn" onClick={onOpenKeys} title="API keys vault">
          <Icon.key /> <span>Keys</span>
          {keysCount > 0 && <span className="pill">{keysCount}</span>}
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
        <SettingsMenu prefs={prefs} setPref={setPref} />
        <div className="avatar">JD</div>
      </div>
    </header>
  );
}
