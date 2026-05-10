import { useCallback, useEffect, useMemo, useState } from "react";
import { TOOLS } from "../data/tools";
import { useStack } from "../hooks/useStack";
import { usePrefs } from "../hooks/usePrefs";
import { useVault } from "../hooks/useVault";
import type { CategoryId, Tool } from "../types";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { CheatSheet, ChordIndicator } from "./CheatSheet";
import { ShareModal } from "./ShareModal";
import { TodayPanel } from "./TodayPanel";
import { TourModal } from "./TourModal";
import { MorningBrew } from "./MorningBrew";
import { QuickActions } from "./QuickActions";
import { DashStats } from "./DashStats";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { CategoryStrip } from "./CategoryStrip";
import { ResultBar } from "./ResultBar";
import { ToolCard } from "./ToolCard";
import { ToolRow } from "./ToolRow";
import { ToolDrawer } from "./ToolDrawer";
import { CompareModal } from "./CompareModal";
import { KeysModal } from "./KeysModal";
import { StackModal } from "./StackModal";
import { AddToolModal } from "./AddToolModal";
import { StarterStacksModal } from "./StarterStacksModal";
import { CommandPalette } from "./CommandPalette";
import { RepoScanModal } from "./RepoScanModal";
import { StackSearchModal } from "./StackSearchModal";
import { AskModal } from "./AskModal";
import { LogsModal } from "./LogsModal";
import { useCustomTools } from "../hooks/useCustomTools";
import { useFrecency } from "../hooks/useFrecency";
import { useGistSync } from "../hooks/useGistSync";
import { useHiddenCatalog } from "../hooks/useHiddenCatalog";
import { useLinkboard } from "../hooks/useLinkboard";
import { usePrivacyMode } from "../hooks/usePrivacyMode";
import { useToolMeta } from "../hooks/useToolMeta";
import { useToolTags } from "../hooks/useToolTags";
import { recordToolLaunch } from "../lib/launchLog";

const COMPARE_MAX = 3;

export function HangarApp() {
  const [prefs, setPref] = usePrefs();

  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<CategoryId>("all");
  const [view, setView] = useState<"grid" | "list">("list");
  const [stack, setStack] = useStack();
  const [compare, setCompare] = useState<string[]>([]);
  const [openTool, setOpenTool] = useState<Tool | null>(null);
  const [showCompare, setShowCompare] = useState(false);
  const [showKeys, setShowKeys] = useState(false);
  const [showStack, setShowStack] = useState(false);
  const [showAddTool, setShowAddTool] = useState(false);
  const [showStarters, setShowStarters] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [showRepoScan, setShowRepoScan] = useState(false);
  const [showStackSearch, setShowStackSearch] = useState(false);
  const [showAsk, setShowAsk] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  // Mobile-only: the sidebar slides in from the left when this is true.
  // No effect on desktop (>800px), where the sidebar is always visible.
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  // Desktop: user can collapse the sidebar to free horizontal space.
  // Persisted globally (not per-workspace) since it's a per-user
  // ergonomic preference, not stack-scoped.
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("hangar-sidebar-collapsed") === "1";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("hangar-sidebar-collapsed", sidebarCollapsed ? "1" : "0");
    } catch {
      // quota / disabled — preference just doesn't persist, no UX harm.
    }
  }, [sidebarCollapsed]);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [keysFocusToolId, setKeysFocusToolId] = useState<string | null>(null);
  const vault = useVault();
  const { secrets, upsertKey, removeKey, state: vaultState } = vault;
  const { customTools, addTool, updateTool, removeTool } = useCustomTools();
  const { meta: toolMeta, setPlan: setToolPlan, recordOpened } = useToolMeta();
  const { frecency, record: recordLaunch } = useFrecency();
  const sync = useGistSync();
  const { links, addLink, removeLink, clearAll: clearLinks } = useLinkboard();
  // Tools the user has hidden from the Browse-catalog list. Doesn't affect
  // pin / sidebar / search — only filters the catalog grid + counts.
  const { hiddenIds, hide: hideTool, restoreAll: restoreHiddenCatalog } =
    useHiddenCatalog();
  // Privacy / screensharing mode — blurs sensitive identifiers (keys,
  // repo names, issue titles, workspace) so the user can demo Hangar
  // or share their screen without leaking real data. Bound to ⌘⇧P.
  const { privacyMode, setPrivacyMode, togglePrivacyMode } = usePrivacyMode();
  // Per-tool user-defined tags + active filter. `activeTag = null` means
  // no tag filter; otherwise narrows both the catalog grid and the
  // sidebar's My Stack list. Underlying `stackTools` array stays the
  // full pinned set so Pulse / Brew / DashStats counts don't react.
  const tags = useToolTags();
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Resolve a stored GitHub token (if any) for use with gist sync.
  const githubToken = secrets["github"]?.find((k) => k.value)?.value || null;
  const allTools = useMemo(() => [...TOOLS, ...customTools], [customTools]);
  // Default: catalog visible. The empty deck-only view below it was reading
  // as "this app has nothing on it" for users with a small stack. People who
  // want a tighter view can collapse with the toggle.
  const [showCatalog, setShowCatalog] = useState(true);
  const totalKeys = useMemo(
    () => Object.values(secrets).reduce((sum, list) => sum + list.length, 0),
    [secrets],
  );

  const stackTools = useMemo(
    () => stack.map((id) => allTools.find((t) => t.id === id)).filter((t): t is Tool => Boolean(t)),
    [stack, allTools],
  );
  const compareTools = useMemo(
    () => compare.map((id) => allTools.find((t) => t.id === id)).filter((t): t is Tool => Boolean(t)),
    [compare, allTools],
  );

  // Hidden tools never enter the visible catalog set — that's the whole
  // point of hide. Pinned tools that the user also hid stay pinned (and
  // remain in the sidebar / Pulse / stack search), they just don't take a
  // row in Browse. Computed as a derived list and reused below for both
  // the filter and the category counts.
  const visibleCatalog = useMemo(
    () => allTools.filter((t) => !hiddenIds.has(t.id)),
    [allTools, hiddenIds],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return visibleCatalog.filter((t) => {
      if (activeCat !== "all" && t.category !== activeCat) return false;
      // Tag filter — when set, narrow to tools carrying that tag.
      // Combines AND-style with the category filter so the user can
      // intersect ("all my marketing-tagged AUTH tools").
      if (activeTag && !tags.tagsFor(t.id).includes(activeTag)) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.tagline.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    });
  }, [query, activeCat, visibleCatalog, activeTag, tags]);

  // Pinned-tools subset for the sidebar's My Stack list. Narrows by
  // active tag when set so "show me my marketing stack" actually hides
  // unrelated pinned tools. The underlying `stackTools` array stays the
  // full set — Pulse / Brew / DashStats / cost rollups all use that
  // unfiltered version so their numbers don't lie when a tag filter
  // is active.
  const stackToolsForDisplay = useMemo(() => {
    if (!activeTag) return stackTools;
    return stackTools.filter((t) => tags.tagsFor(t.id).includes(activeTag));
  }, [stackTools, activeTag, tags]);

  // Category counts mirror the visible catalog so the sidebar / category
  // strip don't promise tools that were hidden out. "all" matches the
  // total visible-catalog size; per-category counts iterate it too.
  const counts = useMemo<Partial<Record<CategoryId, number>>>(() => {
    const c: Partial<Record<CategoryId, number>> = { all: visibleCatalog.length };
    for (const t of visibleCatalog) c[t.category] = (c[t.category] ?? 0) + 1;
    return c;
  }, [visibleCatalog]);

  // The Browse-catalog count chip on the QuickActions card always shows
  // the visible total — same number the catalog grid will render once
  // expanded.
  const visibleToolCount = visibleCatalog.length;

  const togglePin = useCallback(
    (tool: Tool) => {
      setStack((s) => (s.includes(tool.id) ? s.filter((x) => x !== tool.id) : [...s, tool.id]));
    },
    [setStack],
  );

  const handleRemoveCustomTool = useCallback(
    (id: string) => {
      removeTool(id);
      setStack((s) => s.filter((x) => x !== id));
      setCompare((c) => c.filter((x) => x !== id));
    },
    [removeTool, setStack],
  );

  // ⌘K / Ctrl+K opens the command palette from anywhere.
  // ⌘⇧F / Ctrl+Shift+F opens the stack-wide search from anywhere.
  // ⌘⇧A / Ctrl+Shift+A opens "Ask your stack" from anywhere.
  // ⌘⇧P / Ctrl+Shift+P toggles privacy/screensharing mode.
  // Esc on mobile closes the sidebar drawer.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShowPalette((s) => !s);
      } else if (
        (e.key === "f" || e.key === "F") &&
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey
      ) {
        e.preventDefault();
        setShowStackSearch((s) => !s);
      } else if (
        (e.key === "a" || e.key === "A") &&
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey
      ) {
        e.preventDefault();
        setShowAsk((s) => !s);
      } else if (
        (e.key === "p" || e.key === "P") &&
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey
      ) {
        e.preventDefault();
        togglePrivacyMode();
      } else if (e.key === "Escape" && mobileSidebarOpen) {
        setMobileSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileSidebarOpen, togglePrivacyMode]);

  // Body scroll lock while the mobile sidebar drawer is open — prevents the
  // background page from scrolling under the user's finger when scrolling
  // sidebar contents.
  useEffect(() => {
    if (!mobileSidebarOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileSidebarOpen]);

  // First-run guided tour. Replaces an earlier auto-Starter-Stacks behavior;
  // the tour itself ends with a "Try a starter stack" CTA so the entry point
  // is preserved. Stored under a separate flag so anyone who completed the
  // older auto-Starter flow still gets the new tour exactly once.
  useEffect(() => {
    const seen = localStorage.getItem("hangar-tour-completed");
    if (seen) return;
    setShowTour(true);
    // Mark on mount so a refresh during the tour doesn't re-trigger it. The
    // tour can still be dismissed at any step — that counts as "done."
    localStorage.setItem("hangar-tour-completed", "1");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleCompare = useCallback((tool: Tool) => {
    setCompare((c) => {
      if (c.includes(tool.id)) return c.filter((x) => x !== tool.id);
      if (c.length >= COMPARE_MAX) return [...c.slice(1), tool.id];
      return [...c, tool.id];
    });
  }, []);

  const removeFromStack = useCallback(
    (id: string) => setStack((s) => s.filter((x) => x !== id)),
    [setStack],
  );

  const launch = useCallback(
    (tool: Tool) => {
      window.open(tool.accountUrl, "_blank", "noopener,noreferrer");
      recordLaunch(tool.id);
      recordOpened(tool.id);
      // Universal launch log — every "Open" makes the tool's Pulse cell
      // light up + adds a row to the Logs feed. Crucial for tools we
      // don't have native API integrations for (Inngest, Neon, Resend,
      // …) so they don't always render "QUIET".
      recordToolLaunch(tool.id);
    },
    [recordLaunch, recordOpened],
  );

  // Linear-style chord shortcuts. Search input gets id="hangar-search" so
  // "/" can target it without coupling components.
  const { chordPrefix } = useKeyboardShortcuts({
    onOpenCheatSheet: useCallback(() => setShowCheatSheet(true), []),
    onLaunchToolByIndex: useCallback(
      (index: number) => {
        const tool = stackTools[index];
        if (tool) launch(tool);
      },
      [stackTools, launch],
    ),
    onScrollToTop: useCallback(
      () => window.scrollTo({ top: 0, behavior: "smooth" }),
      [],
    ),
    onScrollToToday: useCallback(() => {
      const el = document.querySelector(".today-panel");
      if (el instanceof HTMLElement) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, []),
  });

  const handleOpenCompare = () => {
    if (compare.length >= 2) setShowCompare(true);
  };

  const handleRemoveCompare = (id: string) => {
    setCompare((c) => c.filter((x) => x !== id));
    if (compare.length <= 2) setShowCompare(false);
  };

  return (
    <div className={`app${privacyMode ? " is-privacy-mode" : ""}`}>
      <div className="bg-grid" />
      <div className="bg-glow" />

      <TopBar
        query={query}
        setQuery={setQuery}
        view={view}
        setView={setView}
        stackCount={stack.length}
        compareCount={compare.length}
        onOpenStack={() => setShowStack(true)}
        onOpenCompare={handleOpenCompare}
        stackTools={stackTools}
        onOpenAsk={() => setShowAsk(true)}
        onToggleMobileSidebar={() => setMobileSidebarOpen((s) => !s)}
        sidebarCollapsed={sidebarCollapsed}
        onExpandSidebar={() => setSidebarCollapsed(false)}
        privacyMode={privacyMode}
        onTogglePrivacyMode={togglePrivacyMode}
      />

      <div className={`layout${sidebarCollapsed ? " is-sidebar-collapsed" : ""}`}>
        <Sidebar
          active={activeCat}
          setActive={setActiveCat}
          counts={counts}
          stackTools={stackToolsForDisplay}
          customTools={customTools}
          toolMeta={toolMeta}
          allTags={tags.allTags}
          activeTag={activeTag}
          onSelectTag={setActiveTag}
          onRemoveStack={removeFromStack}
          onOpenTool={setOpenTool}
          onOpenStarters={() => setShowStarters(true)}
          links={links}
          onAddLink={addLink}
          onRemoveLink={removeLink}
          onClearLinks={clearLinks}
          prefs={prefs}
          setPref={setPref}
          vaultState={vaultState}
          keysCount={totalKeys}
          onOpenKeys={() => setShowKeys(true)}
          onSetPassphrase={vault.setPassphrase}
          onChangePassphrase={vault.changePassphrase}
          onRemovePassphrase={vault.removePassphrase}
          onLock={vault.lock}
          sync={{ status: sync.status, lastSyncedAt: sync.lastSyncedAt, error: sync.error }}
          hasGitHubToken={!!githubToken}
          onSyncSetUp={() => githubToken && sync.setUp(githubToken)}
          onSyncPushNow={() => githubToken && sync.pushNow(githubToken)}
          onSyncPullNow={() => githubToken && sync.pullNow(githubToken)}
          onSyncDisconnect={sync.disconnect}
          onOpenShare={() => setShowShare(true)}
          onOpenRepoScan={() => setShowRepoScan(true)}
          isMobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          collapsed={sidebarCollapsed}
          onCollapse={() => setSidebarCollapsed(true)}
          privacyMode={privacyMode}
          onSetPrivacyMode={setPrivacyMode}
        />
        {mobileSidebarOpen && (
          <div
            className="sidebar-backdrop"
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        <main className="main">
          <MorningBrew
            stackTools={stackTools}
            toolMeta={toolMeta}
            secrets={secrets}
            onOpenTool={setOpenTool}
            onAddAnthropicKey={() => {
              setKeysFocusToolId("anthropic");
              setShowKeys(true);
            }}
          />

          <TodayPanel secrets={secrets} onOpenTool={setOpenTool} />

          {/* Five-card action shelf — search · ask · scan · catalog · add.
              Replaces the old catalog-divider button (Browse catalog moved
              into the shelf as a stateful toggle card) and the inert
              ControlDeck stat tiles (now a compact strip below). */}
          <QuickActions
            onOpenAsk={() => setShowAsk(true)}
            onOpenSearch={() => setShowStackSearch(true)}
            onOpenLogs={() => setShowLogs(true)}
            onOpenRepoScan={() => setShowRepoScan(true)}
            onOpenAddTool={() => setShowAddTool(true)}
            onToggleCatalog={() => setShowCatalog((s) => !s)}
            catalogOpen={showCatalog}
            catalogCount={visibleToolCount}
          />

          {/* Compact stack stats — keeps the data dense on one line so the
              fold-line stays high. Each cell now opens a distinct
              destination: pinned/$mo → StackModal, connected/keys →
              KeysModal, catalog cell → toggles the catalog open. "In
              catalog" reflects the visible tools (hidden subtracted) so
              the count matches what the catalog grid will show. */}
          <DashStats
            stackTools={stackTools}
            totalTools={visibleToolCount}
            secrets={secrets}
            toolMeta={toolMeta}
            onOpenStack={() => setShowStack(true)}
            onOpenKeys={() => setShowKeys(true)}
            onToggleCatalog={() => setShowCatalog((s) => !s)}
            catalogOpen={showCatalog}
          />

          {showCatalog && (
            <>
              <CategoryStrip active={activeCat} setActive={setActiveCat} counts={counts} />

              <ResultBar
                filteredCount={filtered.length}
                query={query}
                activeCat={activeCat}
                compareTools={compareTools}
                hiddenCount={hiddenIds.size}
                onRestoreHidden={restoreHiddenCatalog}
                onUncompare={toggleCompare}
                onOpenCompare={() => setShowCompare(true)}
              />

              {view === "grid" ? (
                <div className="grid">
                  {filtered.map((t) => (
                    <ToolCard
                      key={t.id}
                      tool={t}
                      pinned={stack.includes(t.id)}
                      compared={compare.includes(t.id)}
                      onPin={togglePin}
                      onCompare={toggleCompare}
                      onOpen={setOpenTool}
                      onLaunch={launch}
                      onHide={(tool) => hideTool(tool.id)}
                      onRemoveCustom={t.custom ? () => handleRemoveCustomTool(t.id) : undefined}
                    />
                  ))}
                  {filtered.length === 0 && (
                    <div className="empty">
                      <div className="empty-big">No tools match.</div>
                      <div className="muted">Try clearing the search or category.</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="list">
                  <div className="list-head">
                    <div />
                    <div>Tool</div>
                    <div>Category</div>
                    <div>Pricing</div>
                    <div />
                  </div>
                  {filtered.map((t) => (
                    <ToolRow
                      key={t.id}
                      tool={t}
                      pinned={stack.includes(t.id)}
                      compared={compare.includes(t.id)}
                      onPin={togglePin}
                      onCompare={toggleCompare}
                      onOpen={setOpenTool}
                      onLaunch={launch}
                      onHide={(tool) => hideTool(tool.id)}
                      onRemoveCustom={t.custom ? () => handleRemoveCustomTool(t.id) : undefined}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          <footer className="foot">
            <div>Hangar · the dev's control tower · v0.4 (preview)</div>
            <div className="foot-actions">
              <button
                type="button"
                className="foot-help-btn"
                onClick={() => setShowStackSearch(true)}
                title="Search across your connected stack"
              >
                <span className="foot-help-spark">⌕</span> Search stack
                <kbd>⌘⇧F</kbd>
              </button>
              <button
                type="button"
                className="foot-help-btn"
                onClick={() => setShowTour(true)}
                title="Replay the welcome tour"
              >
                <span className="foot-help-spark">✦</span> Show tour
              </button>
              <button
                type="button"
                className="foot-help-btn"
                onClick={() => setShowCheatSheet(true)}
                title="Keyboard shortcuts cheat sheet"
              >
                <kbd>?</kbd> Shortcuts
              </button>
              <span className="muted">
                {allTools.length} tools indexed{customTools.length > 0 && ` · ${customTools.length} custom`}
              </span>
            </div>
          </footer>
        </main>
      </div>

      <ToolDrawer
        tool={openTool}
        pinned={openTool ? stack.includes(openTool.id) : false}
        secrets={secrets}
        toolMeta={toolMeta}
        onSetPlan={setToolPlan}
        onClose={() => setOpenTool(null)}
        onPin={togglePin}
        onLaunch={launch}
        onOpenKeys={() => setShowKeys(true)}
        onAddKeyForTool={(tool) => {
          setKeysFocusToolId(tool.id);
          setShowKeys(true);
        }}
        onEditCustomTool={(tool) => {
          setEditingTool(tool);
          setOpenTool(null);
        }}
        onRemoveCustomTool={(tool) => {
          handleRemoveCustomTool(tool.id);
          setOpenTool(null);
        }}
      />

      {showCompare && (
        <CompareModal
          tools={compareTools}
          onClose={() => setShowCompare(false)}
          onRemove={handleRemoveCompare}
          onLaunch={launch}
        />
      )}

      {showKeys && (
        <KeysModal
          tools={allTools}
          secrets={secrets}
          stack={stack}
          upsertKey={upsertKey}
          removeKey={removeKey}
          focusToolId={keysFocusToolId ?? undefined}
          vaultState={vaultState}
          onUnlock={vault.unlock}
          onClose={() => {
            setShowKeys(false);
            setKeysFocusToolId(null);
          }}
        />
      )}

      {showStack && (
        <StackModal
          tools={stackTools}
          secrets={secrets}
          toolMeta={toolMeta}
          onClose={() => setShowStack(false)}
          onUnpin={togglePin}
          onLaunch={launch}
          onOpenTool={setOpenTool}
        />
      )}

      {showAddTool && (
        <AddToolModal
          onAdd={(tool) => {
            addTool(tool);
            // Auto-pin the new tool so it shows up in the launcher straight away.
            setStack((s) => (s.includes(tool.id) ? s : [...s, tool.id]));
            // Open catalog so the user sees their addition in context.
            setShowCatalog(true);
          }}
          onClose={() => setShowAddTool(false)}
        />
      )}

      {showShare && (
        <ShareModal
          stackTools={stackTools}
          toolMeta={toolMeta}
          onClose={() => setShowShare(false)}
        />
      )}

      {editingTool && (
        <AddToolModal
          existingTool={editingTool}
          onAdd={() => { /* unused in edit mode */ }}
          onUpdate={(tool) => updateTool(tool)}
          onClose={() => setEditingTool(null)}
        />
      )}

      {showPalette && (
        <CommandPalette
          tools={allTools}
          stack={stack}
          frecency={frecency}
          onLaunchTool={launch}
          onOpenTool={setOpenTool}
          onPinTool={togglePin}
          onClose={() => setShowPalette(false)}
          onOpenStarters={() => setShowStarters(true)}
          onOpenAddTool={() => setShowAddTool(true)}
          onOpenKeys={() => setShowKeys(true)}
          onOpenStack={() => setShowStack(true)}
        />
      )}

      {showStarters && (
        <StarterStacksModal
          onAdopt={(ids) => {
            // Merge into existing stack — don't blow away tools the user may already have pinned.
            setStack((s) => {
              const next = [...s];
              for (const id of ids) {
                if (!next.includes(id)) next.push(id);
              }
              return next;
            });
            setShowStarters(false);
          }}
          onClose={() => setShowStarters(false)}
        />
      )}

      <CheatSheet open={showCheatSheet} onClose={() => setShowCheatSheet(false)} />
      <ChordIndicator chord={chordPrefix} />

      {showTour && (
        <TourModal
          onClose={() => setShowTour(false)}
          onOpenStarters={() => setShowStarters(true)}
        />
      )}

      {showRepoScan && (
        <RepoScanModal
          allTools={allTools}
          stack={stack}
          onPin={(toolId) =>
            setStack((s) => (s.includes(toolId) ? s : [...s, toolId]))
          }
          onImportKey={(toolId, entry) => upsertKey(toolId, entry)}
          onClose={() => setShowRepoScan(false)}
        />
      )}

      {showStackSearch && (
        <StackSearchModal
          allTools={allTools}
          secrets={secrets}
          onClose={() => setShowStackSearch(false)}
        />
      )}

      {showAsk && (
        <AskModal
          allTools={allTools}
          stackTools={stackTools}
          toolMeta={toolMeta}
          secrets={secrets}
          onClose={() => setShowAsk(false)}
          onAddAnthropicKey={() => {
            setKeysFocusToolId("anthropic");
            setShowKeys(true);
            setShowAsk(false);
          }}
        />
      )}

      {showLogs && (
        <LogsModal
          secrets={secrets}
          onClose={() => setShowLogs(false)}
          onOpenTool={(tool) => {
            setOpenTool(tool);
            setShowLogs(false);
          }}
          onAddKeyForTool={(tool) => {
            setKeysFocusToolId(tool.id);
            setShowKeys(true);
            setShowLogs(false);
          }}
        />
      )}
    </div>
  );
}
