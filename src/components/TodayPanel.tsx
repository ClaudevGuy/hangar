import { useCallback, useState } from "react";
import { TOOLS } from "../data/tools";
import { useIncidents, type Incident } from "../hooks/useIncidents";
import { Icon } from "../lib/icons";
import {
  buildInvestigateInput,
  generateInvestigation,
  parseInvestigation,
  type ActionPayload,
  type Investigation,
} from "../lib/investigate";
import { timeAgo } from "../lib/timeAgo";
import type { SecretsMap, Tool } from "../types";
import { ToolLogo } from "./ToolLogo";

interface Props {
  secrets: SecretsMap;
  onOpenTool: (tool: Tool) => void;
}

const MAX_VISIBLE = 8;

type InvestigationState =
  | { status: "loading" }
  | { status: "ready"; data: Investigation; rawText?: string }
  | { status: "error"; message: string };

// Aggregated "what needs attention right now" feed across the connected
// providers. Per-incident "Investigate" buttons (when an Anthropic key is
// in the vault) call Claude to diagnose the incident with cross-tool
// context and offer concrete next-action suggestions.
export function TodayPanel({ secrets, onOpenTool }: Props) {
  const feed = useIncidents(secrets);
  const { incidents, loading, hasAnyToken } = feed;
  const anthropicKey = secrets["anthropic"]?.find((k) => k.value)?.value || null;
  const stackPinnedIds = useStackIds(secrets);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [investigations, setInvestigations] = useState<Map<string, InvestigationState>>(
    () => new Map(),
  );

  const runInvestigation = useCallback(
    async (incident: Incident) => {
      if (!anthropicKey) return;
      setInvestigations((prev) => {
        const next = new Map(prev);
        next.set(incident.id, { status: "loading" });
        return next;
      });
      try {
        const input = buildInvestigateInput({
          incident,
          stackToolIds: stackPinnedIds,
          recentDeploys: feed.vercelDeployments,
          recentSentryIssues: feed.sentryIssues,
        });
        const text = await generateInvestigation(input, anthropicKey);
        const parsed = parseInvestigation(text);
        setInvestigations((prev) => {
          const next = new Map(prev);
          if (parsed) {
            next.set(incident.id, { status: "ready", data: parsed });
          } else {
            // Fallback — use a synthetic single-suggestion display so the
            // feature degrades instead of failing entirely.
            next.set(incident.id, {
              status: "ready",
              data: { diagnosis: text, suggestions: [] },
              rawText: text,
            });
          }
          return next;
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setInvestigations((prev) => {
          const next = new Map(prev);
          next.set(incident.id, { status: "error", message: msg });
          return next;
        });
      }
    },
    [anthropicKey, feed.vercelDeployments, feed.sentryIssues, stackPinnedIds],
  );

  const toggleExpand = useCallback(
    (incident: Incident) => {
      if (expandedId === incident.id) {
        setExpandedId(null);
        return;
      }
      setExpandedId(incident.id);
      const existing = investigations.get(incident.id);
      // Auto-fetch on first expand. Re-running is via the explicit Refresh
      // button inside the expanded panel.
      if (!existing || existing.status === "error") {
        void runInvestigation(incident);
      }
    },
    [expandedId, investigations, runInvestigation],
  );

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
              const isExpanded = expandedId === inc.id;
              const investigation = investigations.get(inc.id);
              const onClickRow = () => {
                if (inc.url) {
                  window.open(inc.url, "_blank", "noopener,noreferrer");
                } else if (tool) {
                  onOpenTool(tool);
                }
              };
              return (
                <li key={inc.id} className={`feed-item${isExpanded ? " is-expanded" : ""}`}>
                  <div className="feed-item-row">
                    <button type="button" className="feed-item-btn" onClick={onClickRow}>
                      <span className={`feed-severity sev-${inc.severity}`} aria-hidden="true" />
                      {tool && <ToolLogo tool={tool} size={22} />}
                      <div className="feed-body">
                        <div className="feed-title">{inc.title}</div>
                        {inc.context && <div className="feed-context">{inc.context}</div>}
                      </div>
                      <span className="feed-time">{timeAgo(inc.occurredAt)}</span>
                      <span className="feed-arrow"><Icon.arrow /></span>
                    </button>
                    {anthropicKey && (
                      <button
                        type="button"
                        className={`feed-investigate${isExpanded ? " is-on" : ""}`}
                        onClick={() => toggleExpand(inc)}
                        aria-expanded={isExpanded}
                        title={isExpanded ? "Close investigation" : "Investigate with AI"}
                      >
                        <span className="feed-investigate-spark">✦</span>
                      </button>
                    )}
                  </div>
                  {isExpanded && (
                    <InvestigationPanel
                      state={investigation}
                      onRefresh={() => runInvestigation(inc)}
                      onClose={() => setExpandedId(null)}
                    />
                  )}
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

interface InvestigationPanelProps {
  state: InvestigationState | undefined;
  onRefresh: () => void;
  onClose: () => void;
}

function InvestigationPanel({ state, onRefresh, onClose }: InvestigationPanelProps) {
  if (!state || state.status === "loading") {
    return (
      <div className="feed-investigation feed-investigation-loading">
        <div className="feed-investigation-head">
          <span className="feed-investigation-label">
            <span className="feed-investigation-spark">✦</span> Investigating…
          </span>
        </div>
        <div className="skeleton-line w-90" />
        <div className="skeleton-line w-60" />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="feed-investigation feed-investigation-error">
        <div className="feed-investigation-head">
          <span className="feed-investigation-label">
            <span className="feed-investigation-spark">✦</span> Investigation
          </span>
          <div className="feed-investigation-actions">
            <button type="button" className="feed-investigation-btn" onClick={onRefresh}>
              Retry
            </button>
            <button type="button" className="feed-investigation-close" onClick={onClose} aria-label="Close">
              <Icon.close />
            </button>
          </div>
        </div>
        <p className="feed-investigation-err-msg">
          Couldn&apos;t reach Anthropic: <code>{state.message}</code>
        </p>
      </div>
    );
  }

  return (
    <div className="feed-investigation">
      <div className="feed-investigation-head">
        <span className="feed-investigation-label">
          <span className="feed-investigation-spark">✦</span> Investigation
        </span>
        <div className="feed-investigation-actions">
          <button type="button" className="feed-investigation-btn" onClick={onRefresh}>
            Refresh
          </button>
          <button type="button" className="feed-investigation-close" onClick={onClose} aria-label="Close">
            <Icon.close />
          </button>
        </div>
      </div>
      <p className="feed-investigation-diagnosis">{renderWithBold(state.data.diagnosis)}</p>
      {state.data.suggestions.length > 0 && (
        <ul className="feed-suggestions">
          {state.data.suggestions.map((s, i) => (
            <li key={i} className="feed-suggestion">
              <span className="feed-suggestion-label">{s.label}</span>
              <SuggestionAction action={s.action} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SuggestionAction({ action }: { action: ActionPayload }) {
  const [copied, setCopied] = useState(false);
  if (action.type === "open_url") {
    return (
      <a
        className="feed-suggestion-action"
        href={action.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        Open ↗
      </a>
    );
  }
  return (
    <button
      type="button"
      className="feed-suggestion-action"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(action.text);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1800);
        } catch {
          // ignore — clipboard isn't always available
        }
      }}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

// Renders inline **bold** spans from Claude's output as <strong>.
function renderWithBold(text: string): (string | React.ReactElement)[] {
  const parts: (string | React.ReactElement)[] = [];
  const re = /\*\*([^*]+)\*\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(<strong key={i++}>{match[1]}</strong>);
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

// Reads the user's pinned-tool ids straight from localStorage so we don't have
// to drill them through props. This component already reads secrets from the
// same workspace, so they're guaranteed to be coherent.
function useStackIds(secrets: SecretsMap): string[] {
  // Read directly from the workspace's stack key. A tiny utility — pulls
  // current pinned ids; not memoized because it's cheap and reflows seldom.
  void secrets;
  try {
    // Match the key shape used by useStack/workspaces — same prefix.
    const active = localStorage.getItem("hangar-active-workspace") ?? "default";
    const raw = localStorage.getItem(`hangar-stack-${active}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}
