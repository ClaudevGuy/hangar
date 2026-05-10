// Compact stack stats — replaces the ControlDeck's deck-stats grid. Renders
// as a single inline strip just above the catalog divider so the same
// information stays visible without burning a full panel of vertical space.
//
// Each cell is a clickable label-value-foot chip; clicking opens the most
// relevant surface (Manage stack, Keys vault). Keeps the dashboard's data
// density high without the boxy chrome.

import { TOOLS } from "../data/tools";
import type { ToolMetaMap } from "../hooks/useToolMeta";
import { monthlyTotal } from "../lib/cost";
import type { SecretsMap, Tool } from "../types";

interface Props {
  stackTools: Tool[];
  totalTools: number;
  secrets: SecretsMap;
  toolMeta: ToolMetaMap;
  onOpenStack: () => void;
  onOpenKeys: () => void;
}

export function DashStats({
  stackTools,
  totalTools,
  secrets,
  toolMeta,
  onOpenStack,
  onOpenKeys,
}: Props) {
  const stackCategories = new Set(stackTools.map((t) => t.category)).size;
  const totalCategories = new Set(TOOLS.map((t) => t.category)).size;
  const connectedCount = stackTools.filter(
    (t) => (secrets[t.id]?.length ?? 0) > 0,
  ).length;
  const totalKeysCount = Object.values(secrets).reduce(
    (sum, list) => sum + list.length,
    0,
  );
  const toolsWithKeys = Object.keys(secrets).filter(
    (id) => (secrets[id]?.length ?? 0) > 0,
  ).length;
  const cost = monthlyTotal(stackTools, (id) => toolMeta[id]?.plan);

  return (
    <div className="dash-stats" role="group" aria-label="Stack at a glance">
      <button
        type="button"
        className="ds-cell"
        onClick={onOpenStack}
        title="Open My Stack"
      >
        <span className="ds-num">{stackTools.length}</span>
        <span className="ds-lbl">pinned</span>
        <span className="ds-foot">
          {stackTools.length === 0
            ? `of ${totalTools}`
            : `${stackCategories} ${stackCategories === 1 ? "cat" : "cats"}`}
        </span>
      </button>
      <span className="ds-sep" aria-hidden="true" />
      <button
        type="button"
        className="ds-cell"
        onClick={onOpenStack}
        title="Open My Stack"
      >
        <span className="ds-num">
          {connectedCount > 0 && <span className="ds-pulse" aria-hidden="true" />}
          {connectedCount}
        </span>
        <span className="ds-lbl">connected</span>
        <span className="ds-foot">
          {stackTools.length === 0
            ? "—"
            : `of ${stackTools.length}`}
        </span>
      </button>
      <span className="ds-sep" aria-hidden="true" />
      <button
        type="button"
        className="ds-cell"
        onClick={onOpenKeys}
        title="Open Keys vault"
      >
        <span className="ds-num">{totalKeysCount}</span>
        <span className="ds-lbl">keys</span>
        <span className="ds-foot">
          {totalKeysCount === 0
            ? "vault empty"
            : `${toolsWithKeys} ${toolsWithKeys === 1 ? "tool" : "tools"}`}
        </span>
      </button>
      <span className="ds-sep" aria-hidden="true" />
      <button
        type="button"
        className="ds-cell"
        onClick={onOpenStack}
        title="Set plans on My Stack to track spend"
      >
        <span className="ds-num">${cost.total.toFixed(0)}</span>
        <span className="ds-lbl">/ mo</span>
        <span className="ds-foot">
          {cost.tracked === 0 ? "set plans" : `${cost.tracked} tracked`}
        </span>
      </button>
      <span className="ds-sep" aria-hidden="true" />
      <div className="ds-cell ds-cell-static">
        <span className="ds-num">{totalTools}</span>
        <span className="ds-lbl">in catalog</span>
        <span className="ds-foot">
          {totalCategories} {totalCategories === 1 ? "cat" : "cats"}
        </span>
      </div>
    </div>
  );
}
