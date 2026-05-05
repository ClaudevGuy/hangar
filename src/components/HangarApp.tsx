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
  const { secrets, upsertKey, removeKey } = useSecrets();
  const totalKeys = useMemo(
    () => Object.values(secrets).reduce((sum, list) => sum + list.length, 0),
    [secrets],
  );

  const stackTools = useMemo(
    () => stack.map((id) => TOOLS.find((t) => t.id === id)).filter((t): t is Tool => Boolean(t)),
    [stack],
  );
  const compareTools = useMemo(
    () => compare.map((id) => TOOLS.find((t) => t.id === id)).filter((t): t is Tool => Boolean(t)),
    [compare],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TOOLS.filter((t) => {
      if (activeCat !== "all" && t.category !== activeCat) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.tagline.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    });
  }, [query, activeCat]);

  const counts = useMemo<Partial<Record<CategoryId, number>>>(() => {
    const c: Partial<Record<CategoryId, number>> = { all: TOOLS.length };
    for (const t of TOOLS) c[t.category] = (c[t.category] ?? 0) + 1;
    return c;
  }, []);

  const togglePin = useCallback(
    (tool: Tool) => {
      setStack((s) => (s.includes(tool.id) ? s.filter((x) => x !== tool.id) : [...s, tool.id]));
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
        />

        <main className="main">
          <ControlDeck
            stackTools={stackTools}
            totalTools={TOOLS.length}
            secrets={secrets}
            onPick={setOpenTool}
            onLaunch={launch}
            onOpenStack={() => setShowStack(true)}
          />

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
                <div>Status</div>
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
                />
              ))}
            </div>
          )}

          <footer className="foot">
            <div>Hangar · the dev's control tower · v0.4 (preview)</div>
            <div className="muted">{TOOLS.length} tools indexed</div>
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
          secrets={secrets}
          stack={stack}
          upsertKey={upsertKey}
          removeKey={removeKey}
          onClose={() => setShowKeys(false)}
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
    </div>
  );
}
