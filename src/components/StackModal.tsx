import { useEffect } from "react";
import type { CSSProperties } from "react";
import { Icon } from "../lib/icons";
import type { SecretsMap, Tool } from "../types";
import { ToolLogo } from "./ToolLogo";

interface Props {
  tools: Tool[];
  secrets: SecretsMap;
  onClose: () => void;
  onUnpin: (tool: Tool) => void;
  onLaunch: (tool: Tool) => void;
  onOpenTool: (tool: Tool) => void;
}

export function StackModal({ tools, secrets, onClose, onUnpin, onLaunch, onOpenTool }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const categories = new Set(tools.map((t) => t.category)).size;
  const connectedCount = tools.filter((t) => (secrets[t.id]?.length ?? 0) > 0).length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="stack-modal" onClick={(e) => e.stopPropagation()}>
        <header className="compare-head">
          <h2>
            My stack{" "}
            <span className="muted">
              · {tools.length} {tools.length === 1 ? "tool" : "tools"}
            </span>
          </h2>
          <button type="button" className="drawer-x" onClick={onClose}>
            <Icon.close />
          </button>
        </header>

        {tools.length === 0 ? (
          <div className="stack-empty">
            <div className="empty-big">No pinned tools yet.</div>
            <p className="muted">
              Pin tools you actually use from the catalog. They'll show up here for one-click access
              and feed the stats up top.
            </p>
          </div>
        ) : (
          <>
            <div className="stack-summary">
              <div className="stack-stat">
                <span className="stack-stat-num">{tools.length}</span>
                <span className="stack-stat-lbl">
                  {tools.length === 1 ? "tool" : "tools"} pinned
                </span>
              </div>
              <div className="stack-stat">
                <span className="stack-stat-num">{categories}</span>
                <span className="stack-stat-lbl">
                  {categories === 1 ? "category" : "categories"}
                </span>
              </div>
              <div className="stack-stat">
                <span className="stack-stat-num">{connectedCount}</span>
                <span className="stack-stat-lbl">
                  {connectedCount === 0 ? "no keys yet" : "connected"}
                </span>
              </div>
            </div>

            <div className="stack-grid">
              {tools.map((t) => (
                <article
                  key={t.id}
                  className="stack-card"
                  style={{ "--brand": t.color, "--brand-bg": t.bg } as CSSProperties}
                >
                  <div className="stack-card-head">
                    <ToolLogo tool={t} size={48} />
                    <button
                      type="button"
                      className="chip-btn stack-card-x"
                      onClick={() => onUnpin(t)}
                      title="Unpin from stack"
                    >
                      <Icon.close />
                    </button>
                  </div>
                  <div className="stack-card-meta">
                    <div className="stack-card-name">{t.name}</div>
                    <div className="stack-card-cat">{t.category}</div>
                  </div>
                  <p className="stack-card-tag">{t.tagline}</p>
                  <div className="stack-card-pricing">{t.pricing}</div>
                  <div className="stack-card-actions">
                    <button type="button" className="primary-btn small" onClick={() => onLaunch(t)}>
                      Open <Icon.arrow />
                    </button>
                    <button
                      type="button"
                      className="ghost-btn small"
                      onClick={() => {
                        onClose();
                        onOpenTool(t);
                      }}
                    >
                      Details
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
