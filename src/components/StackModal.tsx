import { useEffect, useMemo } from "react";
import type { CSSProperties } from "react";
import type { ToolMetaMap } from "../hooks/useToolMeta";
import { monthlyTotal, priceForPlan } from "../lib/cost";
import { Icon } from "../lib/icons";
import { timeAgo } from "../lib/timeAgo";
import type { SecretsMap, Tool } from "../types";
import { ToolLogo } from "./ToolLogo";

interface Props {
  tools: Tool[];
  secrets: SecretsMap;
  toolMeta: ToolMetaMap;
  onClose: () => void;
  onUnpin: (tool: Tool) => void;
  onLaunch: (tool: Tool) => void;
  onOpenTool: (tool: Tool) => void;
}

export function StackModal({
  tools,
  secrets,
  toolMeta,
  onClose,
  onUnpin,
  onLaunch,
  onOpenTool,
}: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const categories = new Set(tools.map((t) => t.category)).size;
  const connectedCount = tools.filter((t) => (secrets[t.id]?.length ?? 0) > 0).length;
  const cost = useMemo(
    () => monthlyTotal(tools, (id) => toolMeta[id]?.plan),
    [tools, toolMeta],
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="stack-modal" onClick={(e) => e.stopPropagation()}>
        <header className="stack-head">
          <div className="stack-head-title">
            <Icon.pin filled />
            <h2>My stack</h2>
            <span className="stack-head-meta">
              {tools.length === 0
                ? "no tools yet"
                : `${tools.length} ${tools.length === 1 ? "tool" : "tools"}`}
            </span>
          </div>
          <button
            type="button"
            className="drawer-x stack-close"
            onClick={onClose}
            aria-label="Close"
          >
            <Icon.close />
          </button>
        </header>

        {tools.length === 0 ? (
          <div className="stack-empty">
            <div className="empty-big">No pinned tools yet.</div>
            <p className="muted">
              Pin tools you actually use from the catalog. They&apos;ll show up here for
              one-click access and feed the stats up top.
            </p>
          </div>
        ) : (
          <>
            <div className="stack-summary">
              <div className="stack-stat">
                <span className="stack-stat-num">{tools.length}</span>
                <span className="stack-stat-lbl">pinned</span>
              </div>
              <div className="stack-stat">
                <span className="stack-stat-num">{categories}</span>
                <span className="stack-stat-lbl">
                  {categories === 1 ? "category" : "categories"}
                </span>
              </div>
              <div className="stack-stat">
                <span className="stack-stat-num">
                  {connectedCount > 0 && (
                    <span className="stack-stat-dot" aria-hidden="true" />
                  )}
                  {connectedCount}
                </span>
                <span className="stack-stat-lbl">connected</span>
              </div>
              <div className="stack-stat">
                <span className="stack-stat-num">${cost.total.toFixed(0)}</span>
                <span className="stack-stat-lbl">
                  {cost.tracked === 0
                    ? "set plans to track"
                    : `/ mo · ${cost.tracked} tracked`}
                </span>
              </div>
            </div>

            <div className="stack-grid">
              {tools.map((t) => {
                const meta = toolMeta[t.id];
                const plan = meta?.plan ?? t.plan ?? null;
                const planCost = plan ? priceForPlan(t, plan) : null;
                const lastOpened = meta?.lastOpenedAt ?? null;
                const connected = (secrets[t.id]?.length ?? 0) > 0;
                return (
                  <article
                    key={t.id}
                    className={`stack-card${connected ? " is-connected" : ""}`}
                    style={{ "--brand": t.color, "--brand-bg": t.bg } as CSSProperties}
                  >
                    {/* Brand-color stripe at top — visual identity for the
                        tool without needing the logo to dominate. */}
                    <div className="stack-card-stripe" aria-hidden="true" />

                    <div className="stack-card-head">
                      <ToolLogo tool={t} size={32} />
                      <div className="stack-card-title">
                        <div className="stack-card-name">
                          {t.name}
                          {connected && (
                            <span
                              className="stack-card-dot"
                              aria-hidden="true"
                              title="Connected — key in vault"
                            />
                          )}
                        </div>
                        <div className="stack-card-cat">{t.category}</div>
                      </div>
                      <button
                        type="button"
                        className="stack-card-x"
                        onClick={() => onUnpin(t)}
                        title="Unpin from stack"
                        aria-label={`Unpin ${t.name}`}
                      >
                        <Icon.close />
                      </button>
                    </div>

                    {/* Compact meta — plan (if set) + last-opened time. Falls
                        back to a single muted "no plan tagged" hint so the
                        card height stays consistent across cards. */}
                    <div className="stack-card-meta-row">
                      {plan ? (
                        <span className="stack-card-plan">
                          {plan}
                          {planCost != null && planCost > 0 && (
                            <span className="stack-card-plan-cost">
                              {" · "}${planCost}/mo
                            </span>
                          )}
                          {planCost === 0 && (
                            <span className="stack-card-plan-cost"> · free</span>
                          )}
                        </span>
                      ) : (
                        <span className="stack-card-noplan">no plan tagged</span>
                      )}
                      {lastOpened && (
                        <span className="stack-card-last">
                          opened {timeAgo(lastOpened)}
                        </span>
                      )}
                    </div>

                    <div className="stack-card-actions">
                      <button
                        type="button"
                        className="primary-btn small stack-card-open"
                        onClick={() => onLaunch(t)}
                      >
                        Open <Icon.arrow />
                      </button>
                      <button
                        type="button"
                        className="stack-card-details"
                        onClick={() => {
                          onClose();
                          onOpenTool(t);
                        }}
                        title="Open tool details drawer"
                      >
                        Details
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
