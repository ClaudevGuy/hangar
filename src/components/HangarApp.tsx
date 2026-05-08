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
import { ControlDeck } from "./ControlDeck";
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
import { useCustomTools } from "../hooks/useCustomTools";
import { useFrecency } from "../hooks/useFrecency";
import { useGistSync } from "../hooks/useGistSync";
import { useLinkboard } from "../hooks/useLinkboard";
import { useToolMeta } from "../hooks/useToolMeta";

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
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [keysFocusToolId, setKeysFocusToolId] = useState<string | null>(null);
  const vault = useVault();
  const { secrets, upsertKey, removeKey, state: vaultState } = vault;
  const { customTools, addTool, updateTool, removeTool } = useCustomTools();
  const { meta: toolMeta, setPlan: setToolPlan, recordOpened } = useToolMeta();
  const { frecency, record: recordLaunch } = useFrecency();
  const sync = useGistSync();
  const { links, addLink, removeLink, clearAll: clearLinks } = useLinkboard();

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allTools.filter((t) => {
      if (activeCat !== "all" && t.category !== activeCat) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.tagline.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    });
  }, [query, activeCat, allTools]);

  const counts = useMemo<Partial<Record<CategoryId, number>>>(() => {
    const c: Partial<Record<CategoryId, number>> = { all: allTools.length };
    for (const t of allTools) c[t.category] = (c[t.category] ?? 0) + 1;
    return c;
  }, [allTools]);

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
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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

  const reorderStack = useCallback(
    (fromId: string, toId: string) => {
      setStack((s) => {
        const fromIdx = s.indexOf(fromId);
        const toIdx = s.indexOf(toId);
        if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return s;
        const next = [...s];
        const [item] = next.splice(fromIdx, 1);
        next.splice(toIdx, 0, item);
        return next;
      });
    },
    [setStack],
  );

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
    <div className="app">
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
        toolMeta={toolMeta}
        secrets={secrets}
        onOpenAnthropicKey={() => {
          setKeysFocusToolId("anthropic");
          setShowKeys(true);
        }}
        onOpenAsk={() => setShowAsk(true)}
      />

      <div className="layout">
        <Sidebar
          active={activeCat}
          setActive={setActiveCat}
          counts={counts}
          stackTools={stackTools}
          customTools={customTools}
          toolMeta={toolMeta}
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
        />

        <main className="main">
          <TodayPanel secrets={secrets} onOpenTool={setOpenTool} />

          <ControlDeck
            stackTools={stackTools}
            totalTools={allTools.length}
            secrets={secrets}
            toolMeta={toolMeta}
            onOpenTool={setOpenTool}
            onOpenStack={() => setShowStack(true)}
            onReorderStack={reorderStack}
          />

          <div className="catalog-divider">
            <button
              type="button"
              className="catalog-toggle"
              onClick={() => setShowCatalog((s) => !s)}
              aria-expanded={showCatalog}
            >
              <span className="catalog-toggle-arrow" data-open={showCatalog}>
                ›
              </span>
              Browse catalog
              <span className="muted catalog-toggle-count">{allTools.length} tools</span>
            </button>
            <button
              type="button"
              className="ghost-btn small catalog-add"
              onClick={() => setShowAddTool(true)}
            >
              + Add tool
            </button>
          </div>

          {showCatalog && (
            <>
              <CategoryStrip active={activeCat} setActive={setActiveCat} counts={counts} />

              <ResultBar
                filteredCount={filtered.length}
                query={query}
                activeCat={activeCat}
                compareTools={compareTools}
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
    </div>
  );
}
