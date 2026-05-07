import { useState } from "react";
import { TOOLS } from "../data/tools";
import { useDragScroll } from "../hooks/useDragScroll";
import type { ToolMetaMap } from "../hooks/useToolMeta";
import { monthlyTotal } from "../lib/cost";
import { Icon } from "../lib/icons";
import type { SecretsMap, Tool } from "../types";
import { LauncherTile } from "./LauncherTile";

interface Props {
  stackTools: Tool[];
  totalTools: number;
  secrets: SecretsMap;
  toolMeta: ToolMetaMap;
  onOpenTool: (tool: Tool) => void;
  onOpenStack: () => void;
  onReorderStack: (fromId: string, toId: string) => void;
}

export function ControlDeck({
  stackTools, totalTools, secrets, toolMeta, onOpenTool, onOpenStack, onReorderStack,
}: Props) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const stackCategories = new Set(stackTools.map((t) => t.category)).size;
  const totalCategories = new Set(TOOLS.map((t) => t.category)).size;
  const connectedCount = stackTools.filter((t) => (secrets[t.id]?.length ?? 0) > 0).length;
  const totalKeysCount = Object.values(secrets).reduce((sum, list) => sum + list.length, 0);
  const toolsWithKeys = Object.keys(secrets).filter((id) => (secrets[id]?.length ?? 0) > 0).length;
  const cost = monthlyTotal(stackTools, (id) => toolMeta[id]?.plan);
  const { ref: launcherRef, dragging: launcherDragging } = useDragScroll<HTMLDivElement>();

  return (
    <section className="deck">
      {stackTools.length > 0 && (
        <div className="stack-launcher">
          <div className="stack-launcher-head">
            <div className="strip-label">Your stack</div>
            <button type="button" className="ghost-btn small" onClick={onOpenStack}>
              Manage <Icon.arrow />
            </button>
          </div>
          <div
            ref={launcherRef}
            className={`stack-launcher-row ${launcherDragging ? "is-dragging" : ""}`}
          >
            {stackTools.map((t) => (
              <LauncherTile
                key={t.id}
                tool={t}
                secrets={secrets}
                draggingId={draggingId}
                dragOverId={dragOverId}
                onOpenTool={onOpenTool}
                onDragStart={(toolId, e) => {
                  setDraggingId(toolId);
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", toolId);
                }}
                onDragOver={(toolId, e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (dragOverId !== toolId) setDragOverId(toolId);
                }}
                onDragLeave={(toolId) => {
                  if (dragOverId === toolId) setDragOverId(null);
                }}
                onDrop={(toolId, e) => {
                  e.preventDefault();
                  const fromId = draggingId ?? e.dataTransfer.getData("text/plain");
                  if (fromId && fromId !== toolId) onReorderStack(fromId, toolId);
                  setDraggingId(null);
                  setDragOverId(null);
                }}
                onDragEnd={() => {
                  setDraggingId(null);
                  setDragOverId(null);
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="deck-stats">
        <div className="stat">
          <div className="stat-lbl">Pinned</div>
          <div className="stat-num">{stackTools.length}</div>
          <div className="stat-foot">
            {stackTools.length === 0
              ? `none yet · ${totalTools} in catalog`
              : `of ${totalTools} · ${stackCategories} ${stackCategories === 1 ? "category" : "categories"}`}
          </div>
        </div>
        <div className="stat">
          <div className="stat-lbl">
            {connectedCount > 0 && <span className="status-dot live" />}
            Connected
          </div>
          <div className="stat-num">{connectedCount}</div>
          <div className="stat-foot">
            {stackTools.length === 0
              ? "pin a tool to start"
              : connectedCount === 0
                ? "no keys stored"
                : `of ${stackTools.length} pinned`}
          </div>
        </div>
        <div className="stat">
          <div className="stat-lbl">Keys</div>
          <div className="stat-num">{totalKeysCount}</div>
          <div className="stat-foot">
            {totalKeysCount === 0
              ? "vault is empty"
              : `across ${toolsWithKeys} ${toolsWithKeys === 1 ? "tool" : "tools"}`}
          </div>
        </div>
        <div className="stat">
          <div className="stat-lbl">Monthly</div>
          <div className="stat-num">${cost.total.toFixed(0)}</div>
          <div className="stat-foot">
            {stackTools.length === 0
              ? "pin tools to track"
              : cost.tracked === 0
                ? "set plans to track"
                : `${cost.tracked} tracked${cost.untracked > 0 ? ` · ${cost.untracked} untracked` : ""}`}
          </div>
        </div>
        <div className="stat">
          <div className="stat-lbl">In catalog</div>
          <div className="stat-num">{totalTools}</div>
          <div className="stat-foot">
            {totalCategories} {totalCategories === 1 ? "category" : "categories"}
          </div>
        </div>
      </div>
    </section>
  );
}
