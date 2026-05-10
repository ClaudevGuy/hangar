import { useCallback, useState } from "react";
import { TOOLS } from "../data/tools";
import { useDismissedIncidents } from "../hooks/useDismissedIncidents";
import { useIncidents, type Incident } from "../hooks/useIncidents";
import { useNotes } from "../hooks/useNotes";
import { Icon } from "../lib/icons";
import { NotesSection } from "./NotesSection";
import {
  buildInvestigateInput,
  generateInvestigation,
  parseInvestigation,
  type ActionPayload,
  type Investigation,
} from "../lib/investigate";
import {
  ignoreSentryIssue,
  resolveSentryIssue,
  snoozeLinearIssue,
} from "../lib/quickActions";
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
  // Notes expansion is tracked separately so it can coexist with the AI
  // investigate panel — only one inline panel per row at a time. When the
  // user opens one, the other closes.
  const [notesExpandedId, setNotesExpandedId] = useState<string | null>(null);
  const [investigations, setInvestigations] = useState<Map<string, InvestigationState>>(
    () => new Map(),
  );
  const notes = useNotes();

  // Dismissal state — persisted across sessions so manually-hidden items
  // (and stale Vercel failures the user has acknowledged) stay hidden.
  // Quick Actions also use this for optimistic UI: dismiss → call API →
  // undismiss + show error on failure.
  const { dismissedIds, dismiss, undismiss, dismissMany, restoreAll } = useDismissedIncidents();
  const [actionError, setActionError] = useState<{ incidentId: string; message: string } | null>(
    null,
  );

  const sentryToken = secrets["sentry"]?.find((k) => k.value)?.value || null;
  const linearToken = secrets["linear"]?.find((k) => k.value)?.value || null;

  const runQuickAction = useCallback(
    async (incident: Incident, exec: () => Promise<void>) => {
      // Optimistic dismiss — fade out the row immediately.
      dismiss(incident.id);
      setActionError((cur) => (cur?.incidentId === incident.id ? null : cur));
      try {
        await exec();
      } catch (err) {
        // Restore the row and show the error briefly.
        undismiss(incident.id);
        const message = err instanceof Error ? err.message : "Action failed";
        setActionError({ incidentId: incident.id, message });
        window.setTimeout(() => {
          setActionError((cur) => (cur?.incidentId === incident.id ? null : cur));
        }, 4500);
      }
    },
    [dismiss, undismiss],
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
      // One inline panel at a time — close any open notes editor.
      setNotesExpandedId((cur) => (cur === incident.id ? null : cur));
      const existing = investigations.get(incident.id);
      // Auto-fetch on first expand. Re-running is via the explicit Refresh
      // button inside the expanded panel.
      if (!existing || existing.status === "error") {
        void runInvestigation(incident);
      }
    },
    [expandedId, investigations, runInvestigation],
  );

  const toggleNotes = useCallback((incident: Incident) => {
    setNotesExpandedId((cur) => (cur === incident.id ? null : incident.id));
    // Close investigation if it's open on the same row.
    setExpandedId((cur) => (cur === incident.id ? null : cur));
  }, []);

  if (!hasAnyToken) return null;

  const showSkeleton = loading && incidents.length === 0;
  const visibleIncidents = incidents.filter((inc) => !dismissedIds.has(inc.id));
  const visible = visibleIncidents.slice(0, MAX_VISIBLE);
  const hidden = Math.max(0, visibleIncidents.length - MAX_VISIBLE);
  // How many of the live incidents the user has manually hidden — anchors
  // the "Restore" affordance so dismissals aren't a one-way trap, and feeds
  // the inbox progress meter ("you cleared 8 of 20 today").
  const dismissedCount = incidents.filter((inc) => dismissedIds.has(inc.id)).length;
  const inboxTotal = incidents.length;
  const remaining = visibleIncidents.length;
  // Progress percent = how much of today's inbox the user has cleared.
  // Falls back to 0 when the inbox is empty (or already at zero, in which
  // case we render the celebration state instead of a meter).
  const clearedPct =
    inboxTotal > 0 ? Math.min(100, Math.round((dismissedCount / inboxTotal) * 100)) : 0;
  const isInboxZero = !showSkeleton && inboxTotal > 0 && remaining === 0;
  // Truly nothing to do — no incidents pending and none dismissed today
  // either. Render as a slim chip rather than a full panel so the dashboard
  // stays compact when the stack is calm.
  const isAllClear = !showSkeleton && inboxTotal === 0;

  const handleClearAll = () => {
    if (visibleIncidents.length === 0) return;
    dismissMany(visibleIncidents.map((inc) => inc.id));
  };

  // Slim "all clear" chip — the dashboard's quietest state. One line, no
  // chrome panel, just confirmation that the stack is calm. Reclaims the
  // ~80px the empty-state panel used to burn.
  if (isAllClear) {
    return (
      <div className="inbox-chip" role="status" aria-live="polite">
        <span className="inbox-chip-badge" aria-hidden="true">
          <Icon.check />
        </span>
        <span className="inbox-chip-text">
          <strong>Inbox clear</strong> · nothing pressing across your stack.
        </span>
      </div>
    );
  }

  return (
    <section className="today-panel inbox-panel">
      <div className="feed-head">
        <div className="inbox-head-titles">
          <div className="strip-label">Inbox</div>
          {!showSkeleton && inboxTotal > 0 && (
            <div className="inbox-counter" aria-live="polite">
              <span className="inbox-counter-now">{remaining}</span>
              <span className="inbox-counter-arrow" aria-hidden="true">→</span>
              <span className="inbox-counter-zero">0</span>
            </div>
          )}
        </div>
        <div className="feed-head-meta">
          {showSkeleton
            ? "checking…"
            : inboxTotal === 0
              ? "all clear"
              : remaining === 0
                ? `cleared ${dismissedCount}`
                : `${remaining} to triage`}
          {dismissedCount > 0 && (
            <button
              type="button"
              className="feed-restore"
              onClick={restoreAll}
              title="Restore all dismissed items"
            >
              · {dismissedCount} hidden · restore
            </button>
          )}
          {visibleIncidents.length > 0 && !showSkeleton && (
            <button
              type="button"
              className="feed-clear-all"
              onClick={handleClearAll}
              title="Hide every item below"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {!showSkeleton && inboxTotal > 0 && (
        <div
          className={`inbox-progress${isInboxZero ? " is-zero" : ""}`}
          role="progressbar"
          aria-valuenow={clearedPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Inbox cleared progress"
        >
          <div className="inbox-progress-fill" style={{ width: `${clearedPct}%` }} />
        </div>
      )}

      {showSkeleton ? (
        <div className="feed-list">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="feed-item feed-item-skeleton">
              <div className="skeleton-line w-90" />
              <div className="skeleton-line w-60" />
            </div>
          ))}
        </div>
      ) : isInboxZero ? (
        <div className="feed-empty inbox-zero-celebrate">
          <span className="inbox-zero-badge" aria-hidden="true">
            <Icon.check />
          </span>
          <div className="inbox-zero-text">
            <div className="inbox-zero-headline">Inbox Zero</div>
            <div className="inbox-zero-sub">
              You cleared {dismissedCount} {dismissedCount === 1 ? "item" : "items"} today. Nothing left to triage.
            </div>
          </div>
          <button
            type="button"
            className="ghost-btn small"
            onClick={restoreAll}
            title="Bring back everything you dismissed"
          >
            Restore
          </button>
        </div>
      ) : visibleIncidents.length === 0 ? (
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
                    {(() => {
                      // Per-incident Quick Actions — browser-direct API calls
                      // authenticated with the user's vault token. Dismisses
                      // the row optimistically; the error banner below
                      // restores it on failure.
                      if (inc.raw.kind === "sentry-issue" && sentryToken) {
                        const sentryId = inc.raw.data.id;
                        return (
                          <div className="feed-actions">
                            <button
                              type="button"
                              className="feed-action"
                              onClick={(e) => {
                                e.stopPropagation();
                                void runQuickAction(inc, () => resolveSentryIssue(sentryId, sentryToken));
                              }}
                              title="Resolve issue"
                              aria-label="Resolve Sentry issue"
                            >
                              <Icon.check />
                            </button>
                            <button
                              type="button"
                              className="feed-action"
                              onClick={(e) => {
                                e.stopPropagation();
                                void runQuickAction(inc, () => ignoreSentryIssue(sentryId, sentryToken));
                              }}
                              title="Ignore issue"
                              aria-label="Ignore Sentry issue"
                            >
                              <span className="feed-action-symbol" aria-hidden>⊘</span>
                            </button>
                          </div>
                        );
                      }
                      if (inc.raw.kind === "linear-issue" && linearToken) {
                        const linearId = inc.raw.data.id;
                        return (
                          <div className="feed-actions">
                            <button
                              type="button"
                              className="feed-action"
                              onClick={(e) => {
                                e.stopPropagation();
                                void runQuickAction(inc, () => snoozeLinearIssue(linearId, linearToken));
                              }}
                              title="Snooze (lower priority to Low)"
                              aria-label="Snooze Linear issue"
                            >
                              <span className="feed-action-symbol" aria-hidden>↓</span>
                            </button>
                          </div>
                        );
                      }
                      return null;
                    })()}
                    {actionError?.incidentId === inc.id && (
                      <span
                        className="feed-action-error"
                        title={actionError.message}
                      >
                        failed
                      </span>
                    )}
                    {(() => {
                      const incidentNotes = notes.notesForIncident(inc.id);
                      const notesOpen = notesExpandedId === inc.id;
                      return (
                        <button
                          type="button"
                          className={`feed-note-btn${notesOpen ? " is-on" : ""}${incidentNotes.length > 0 ? " has-notes" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleNotes(inc);
                          }}
                          aria-expanded={notesOpen}
                          title={
                            incidentNotes.length > 0
                              ? `${incidentNotes.length} note${incidentNotes.length === 1 ? "" : "s"} on this incident`
                              : "Add a note about this incident"
                          }
                          aria-label="Notes"
                        >
                          <Icon.note />
                          {incidentNotes.length > 0 && (
                            <span className="feed-note-count">{incidentNotes.length}</span>
                          )}
                        </button>
                      );
                    })()}
                    <button
                      type="button"
                      className="feed-dismiss"
                      onClick={(e) => {
                        e.stopPropagation();
                        dismiss(inc.id);
                      }}
                      title="Hide locally (won't change the source tool)"
                      aria-label="Dismiss"
                    >
                      <Icon.close />
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
                  {notesExpandedId === inc.id && (
                    <div className="feed-notes-panel">
                      <div className="feed-notes-head">
                        <span className="feed-notes-label">
                          <Icon.note /> Notes
                        </span>
                        <button
                          type="button"
                          className="feed-investigation-close"
                          onClick={() => setNotesExpandedId(null)}
                          aria-label="Close notes"
                        >
                          <Icon.close />
                        </button>
                      </div>
                      <NotesSection
                        compact
                        notes={notes.notesForIncident(inc.id)}
                        onAdd={(text) =>
                          notes.addNote(text, { kind: "incident", incidentId: inc.id })
                        }
                        onUpdate={notes.updateNote}
                        onRemove={notes.removeNote}
                        placeholder="Why did this happen? How did you fix it last time?"
                        startInAdd
                      />
                    </div>
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
