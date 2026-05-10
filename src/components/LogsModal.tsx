// Logs — unified chronological feed of every event across the user's
// connected tools. Reads from useIncidents (which already aggregates
// vercel/github/sentry/linear data via shared per-token cache), so
// opening the modal triggers zero extra fetches when the dashboard has
// already loaded that data.
//
// Filter chips on top let users narrow to a single tool. Empty states
// guide the user to add a key when nothing is connected.

import { useMemo, useState } from "react";
import { TOOLS } from "../data/tools";
import { useIncidents } from "../hooks/useIncidents";
import { buildActivityLog, countLast24h, type LogEntry } from "../lib/activityLog";
import { Icon } from "../lib/icons";
import { timeAgo } from "../lib/timeAgo";
import type { SecretsMap, Tool } from "../types";
import { ToolLogo } from "./ToolLogo";

interface Props {
  onClose: () => void;
  onOpenTool: (tool: Tool) => void;
  onAddKeyForTool: (tool: Tool) => void;
  secrets: SecretsMap;
}

// All tool ids that the activity log can produce entries for. Used to
// build the filter chip set even when a given tool has zero entries
// (so the user sees "Sentry · 0" and knows it's connected). Anthropic
// is included because Hangar logs its own Brief/Brew/Ask/Investigate
// calls — see lib/anthropicLog.ts. Unlike the other entries it's
// gated on having a vault key (the chip only renders when a key is
// present), since events without a key would never have happened.
const ACTIVITY_TOOL_IDS = ["vercel", "github", "sentry", "linear", "anthropic"] as const;

export function LogsModal({ onClose, onOpenTool, onAddKeyForTool, secrets }: Props) {
  const feed = useIncidents(secrets);
  const entries = useMemo(() => buildActivityLog(feed), [feed]);
  const last24hCount = useMemo(() => countLast24h(entries), [entries]);
  const [filter, setFilter] = useState<string>("all");

  // Per-tool counts power the filter chip badges. Computed once per
  // entries change.
  const countsByTool = useMemo(() => {
    const c: Record<string, number> = {};
    for (const e of entries) c[e.toolId] = (c[e.toolId] ?? 0) + 1;
    return c;
  }, [entries]);

  const visible = filter === "all"
    ? entries
    : entries.filter((e) => e.toolId === filter);

  // Connected providers — drives both the filter chip set (we only show
  // chips for tools the user actually has a key for) and the empty-state
  // copy ("connect Vercel/Sentry/Linear/GitHub to see logs").
  const connectedToolIds = ACTIVITY_TOOL_IDS.filter(
    (id) => (secrets[id]?.length ?? 0) > 0,
  );
  const isAnythingConnected = connectedToolIds.length > 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal logs-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Logs"
      >
        <header className="logs-head">
          <div className="logs-head-title">
            <h2>Logs</h2>
            <p className="muted">
              Chronological feed of every event across your connected tools.
              {isAnythingConnected && entries.length > 0 && (
                <>
                  {" "}
                  <strong>{last24hCount}</strong> in the last 24h ·{" "}
                  <strong>{entries.length}</strong> in the last 7 days.
                </>
              )}
            </p>
          </div>
          <button
            type="button"
            className="drawer-x logs-close"
            onClick={onClose}
            aria-label="Close"
          >
            <Icon.close />
          </button>
        </header>

        {isAnythingConnected && (
          <div className="logs-filters" role="tablist" aria-label="Filter logs by tool">
            <FilterChip
              label="All"
              count={entries.length}
              active={filter === "all"}
              onClick={() => setFilter("all")}
            />
            {connectedToolIds.map((id) => {
              const tool = TOOLS.find((t) => t.id === id);
              if (!tool) return null;
              return (
                <FilterChip
                  key={id}
                  label={tool.name}
                  logo={tool}
                  count={countsByTool[id] ?? 0}
                  active={filter === id}
                  onClick={() => setFilter(id)}
                />
              );
            })}
          </div>
        )}

        <div className="logs-body">
          {!isAnythingConnected ? (
            <EmptyConnect onAddKeyForTool={onAddKeyForTool} />
          ) : feed.loading && entries.length === 0 ? (
            <div className="logs-loading">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="log-row log-row-skeleton">
                  <div className="skeleton-line w-90" />
                  <div className="skeleton-line w-60" />
                </div>
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="logs-empty">
              <Icon.check />
              <span>
                {filter === "all"
                  ? "No activity in the last 7 days across your connected tools."
                  : "No recent activity for this tool."}
              </span>
            </div>
          ) : (
            <ul className="logs-list">
              {visible.map((entry) => (
                <LogRow
                  key={entry.id}
                  entry={entry}
                  onOpenTool={onOpenTool}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

interface FilterChipProps {
  label: string;
  count: number;
  active: boolean;
  logo?: Tool;
  onClick: () => void;
}

function FilterChip({ label, count, active, logo, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={`logs-chip${active ? " is-active" : ""}`}
      onClick={onClick}
    >
      {logo && <ToolLogo tool={logo} size={14} />}
      <span>{label}</span>
      <span className="logs-chip-count">{count}</span>
    </button>
  );
}

interface LogRowProps {
  entry: LogEntry;
  onOpenTool: (tool: Tool) => void;
}

function LogRow({ entry, onOpenTool }: LogRowProps) {
  const tool = TOOLS.find((t) => t.id === entry.toolId);
  const handleClick = () => {
    if (entry.url) {
      window.open(entry.url, "_blank", "noopener,noreferrer");
    } else if (tool) {
      onOpenTool(tool);
    }
  };

  return (
    <li className={`log-row log-status-${entry.status}`}>
      <button
        type="button"
        className="log-row-btn"
        onClick={handleClick}
        title={entry.url ?? `${entry.title} · ${entry.context ?? ""}`}
      >
        <span className={`log-status-dot status-${entry.status}`} aria-hidden="true" />
        {tool && <ToolLogo tool={tool} size={20} />}
        <div className="log-body">
          <div className="log-title">{entry.title}</div>
          {entry.context && <div className="log-context">{entry.context}</div>}
        </div>
        <span className="log-kind" aria-hidden="true">
          {entry.kind}
        </span>
        <span className="log-time">{timeAgo(entry.timestamp)}</span>
      </button>
    </li>
  );
}

function EmptyConnect({
  onAddKeyForTool,
}: {
  onAddKeyForTool: (tool: Tool) => void;
}) {
  // Pull the four supported provider tools from the catalog so the empty
  // state can render real logos + clickable "Connect X" buttons. Skips
  // anything missing (defensive — TOOLS is unlikely to drop one).
  const supported = ACTIVITY_TOOL_IDS
    .map((id) => TOOLS.find((t) => t.id === id))
    .filter((t): t is Tool => Boolean(t));
  return (
    <div className="logs-empty-connect">
      <div className="logs-empty-headline">No tools connected.</div>
      <p className="muted">
        Logs aggregates real events from your connected providers. Connect any
        of these to start seeing activity:
      </p>
      <div className="logs-empty-tools">
        {supported.map((tool) => (
          <button
            key={tool.id}
            type="button"
            className="ghost-btn"
            onClick={() => onAddKeyForTool(tool)}
          >
            <ToolLogo tool={tool} size={18} />
            <span>Connect {tool.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
