import { CATEGORIES } from "../data/tools";
import { Icon } from "../lib/icons";
import type { CategoryId, Tool } from "../types";
import { ToolLogo } from "./ToolLogo";

interface Props {
  filteredCount: number;
  query: string;
  activeCat: CategoryId;
  compareTools: Tool[];
  onUncompare: (tool: Tool) => void;
  onOpenCompare: () => void;
}

export function ResultBar({
  filteredCount,
  query,
  activeCat,
  compareTools,
  onUncompare,
  onOpenCompare,
}: Props) {
  const activeCategoryName = CATEGORIES.find((c) => c.id === activeCat)?.name;
  return (
    <div className="result-bar">
      <div className="result-count">
        {filteredCount} <span className="muted">{filteredCount === 1 ? "tool" : "tools"}</span>
        {query && <span className="muted"> · matching “{query}”</span>}
        {activeCat !== "all" && <span className="muted"> · {activeCategoryName}</span>}
      </div>
      {compareTools.length > 0 && (
        <div className="compare-tray">
          <span className="muted">Comparing:</span>
          {compareTools.map((t) => (
            <span key={t.id} className="compare-chip">
              <ToolLogo tool={t} size={16} /> {t.name}
              <button type="button" onClick={() => onUncompare(t)}>
                <Icon.close />
              </button>
            </span>
          ))}
          {compareTools.length >= 2 && (
            <button type="button" className="primary-btn small" onClick={onOpenCompare}>
              Compare side by side <Icon.arrow />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
