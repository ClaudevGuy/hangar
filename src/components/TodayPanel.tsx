import { TOOLS } from "../data/tools";
import { useIncidents } from "../hooks/useIncidents";
import { Icon } from "../lib/icons";
import { timeAgo } from "../lib/timeAgo";
import type { SecretsMap, Tool } from "../types";
import { ToolLogo } from "./ToolLogo";

interface Props {
  secrets: SecretsMap;
  onOpenTool: (tool: Tool) => void;
}

const MAX_VISIBLE = 8;

// Aggregated "what needs attention right now" feed across the connected
// providers. The killer feature of a control tower: one ordered stream of
// signals, not 30 separate dashboards.
export function TodayPanel({ secrets, onOpenTool }: Props) {
  const { incidents, loading, hasAnyToken } = useIncidents(secrets);

  if (!hasAnyToken) return null;

  const showSkeleton = loading && incidents.length === 0;
  const visible = incidents.slice(0, MAX_VISIBLE);
  const hidden = Math.max(0, incidents.length - MAX_VISIBLE);

  return (
    <section className="today-panel">
      <div className="feed-head">
        <div className="strip-label">Today</div>
        <div className="feed-head-meta">
          {showSkeleton
            ? "checking…"
            : incidents.length === 0
              ? "all clear"
              : `${incidents.length} ${incidents.length === 1 ? "item" : "items"} to look at`}
        </div>
      </div>

      {showSkeleton ? (
        <div className="feed-list">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="feed-item feed-item-skeleton">
              <div className="skeleton-line w-90" />
              <div className="skeleton-line w-60" />
            </div>
          ))}
        </div>
      ) : incidents.length === 0 ? (
        <div className="feed-empty">
          <Icon.check />
          <span>Nothing pressing across your stack right now.</span>
        </div>
      ) : (
        <>
          <ul className="feed-list">
            {visible.map((inc) => {
              const tool = TOOLS.find((t) => t.id === inc.source);
              const onClick = () => {
                if (inc.url) {
                  window.open(inc.url, "_blank", "noopener,noreferrer");
                } else if (tool) {
                  onOpenTool(tool);
                }
              };
              return (
                <li key={inc.id} className="feed-item">
                  <button type="button" className="feed-item-btn" onClick={onClick}>
                    <span className={`feed-severity sev-${inc.severity}`} aria-hidden="true" />
                    {tool && <ToolLogo tool={tool} size={22} />}
                    <div className="feed-body">
                      <div className="feed-title">{inc.title}</div>
                      {inc.context && <div className="feed-context">{inc.context}</div>}
                    </div>
                    <span className="feed-time">{timeAgo(inc.occurredAt)}</span>
                    <span className="feed-arrow"><Icon.arrow /></span>
                  </button>
                </li>
              );
            })}
          </ul>
          {hidden > 0 && (
            <div className="feed-more muted">
              +{hidden} more — open a tool drawer for the full list.
            </div>
          )}
        </>
      )}
    </section>
  );
}
