import { useCallback, useMemo, useState } from "react";
import { TOOLS } from "../data/tools";
import { useStack } from "../hooks/useStack";
import { usePrefs } from "../hooks/usePrefs";
import { useSecrets } from "../hooks/useSecrets";
import type { CategoryId, Tool } from "../types";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { ControlDeck } from "./ControlDeck";
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
import { useCustomTools } from "../hooks/useCustomTools";

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
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [keysFocusToolId, setKeysFocusToolId] = useState<string | null>(null);
  const { secrets, upsertKey, removeKey } = useSecrets();
  const { customTools, addTool, updateTool, removeTool } = useCustomTools();
  const allTools = useMemo(() => [...TOOLS, ...customTools], [customTools]);
  const [showCatalog, setShowCatalog] = useState(() => stack.length === 0);
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

  const launch = useCallback((tool: Tool) => {
    window.open(tool.accountUrl, "_blank", "noopener,noreferrer");
  }, []);

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
        prefs={prefs}
        setPref={setPref}
        stackCount={stack.length}
        compareCount={compare.length}
        keysCount={totalKeys}
        onOpenStack={() => setShowStack(true)}
        onOpenCompare={handleOpenCompare}
        onOpenKeys={() => setShowKeys(true)}
      />

      <div className="layout">
        <Sidebar
          active={activeCat}
          setActive={setActiveCat}
          counts={counts}
          stackTools={stackTools}
          onRemoveStack={removeFromStack}
          onOpenTool={setOpenTool}
          onOpenStarters={() => setShowStarters(true)}
        />

        <main className="main">
          <ControlDeck
            stackTools={stackTools}
            totalTools={allTools.length}
            secrets={secrets}
            onPick={setOpenTool}
            onLaunch={launch}
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
            <div className="muted">
              {allTools.length} tools indexed{customTools.length > 0 && ` · ${customTools.length} custom`}
            </div>
          </footer>
        </main>
      </div>

      <ToolDrawer
        tool={openTool}
        pinned={openTool ? stack.includes(openTool.id) : false}
        secrets={secrets}
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

      {editingTool && (
        <AddToolModal
          existingTool={editingTool}
          onAdd={() => { /* unused in edit mode */ }}
          onUpdate={(tool) => updateTool(tool)}
          onClose={() => setEditingTool(null)}
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
    </div>
  );
}
