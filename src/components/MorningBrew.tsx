// Morning Brew — the hero panel at the top of /app's main column.
// Combines an AI-generated narrative briefing with the Stack Pulse waveform
// strip. Both pieces share a common datasource (useIncidents) but neither
// owns it: useIncidents is per-token cached so calling it here AND in
// TodayPanel hits the same cached state, no extra fetches.

import { useMemo, type ReactElement } from "react";
import { useIncidents } from "../hooks/useIncidents";
import { useMorningBrew } from "../hooks/useMorningBrew";
import { useStackPulse } from "../hooks/useStackPulse";
import type { ToolMetaMap } from "../hooks/useToolMeta";
import { Icon } from "../lib/icons";
import { timeAgo } from "../lib/timeAgo";
import type { SecretsMap, Tool } from "../types";
import { StackPulse } from "./StackPulse";

interface Props {
  stackTools: Tool[];
  toolMeta: ToolMetaMap;
  secrets: SecretsMap;
  onOpenTool: (tool: Tool) => void;
  onAddAnthropicKey: () => void;
}

export function MorningBrew({
  stackTools,
  toolMeta,
  secrets,
  onOpenTool,
  onAddAnthropicKey,
}: Props) {
  const apiKey = secrets["anthropic"]?.find((k) => k.value)?.value || null;
  const feed = useIncidents(secrets);
  const tracks = useStackPulse(stackTools, feed);
  const brew = useMorningBrew({
    apiKey,
    stackTools,
    toolMeta,
    incidents: feed.incidents,
  });

  const totalActivity24h = useMemo(
    () => tracks.reduce((sum, t) => sum + t.totalActivity, 0),
    [tracks],
  );
  const errorTools = useMemo(
    () => tracks.filter((t) => t.hasErrors).length,
    [tracks],
  );

  // Hide the brew panel entirely when the user has no stack — there's
  // nothing to brief on, and an empty hero would just steal vertical space
  // from the Linkboard / starter flow.
  if (stackTools.length === 0) return null;

  const headRefreshLabel = brew.status === "ready"
    ? brew.isStale ? "Refresh for today" : "Refresh"
    : "Brew now";

  return (
    <section className="brew">
      <div className="brew-head">
        <div className="strip-label">Morning Brew</div>
        <div className="brew-head-meta">
          {brew.status === "ready" && brew.generatedAt && (
            <span className={`brew-stamp${brew.isStale ? " is-stale" : ""}`}>
              {brew.isStale ? "from " : "briefed "}
              {timeAgo(brew.generatedAt)}
            </span>
          )}
          {apiKey && brew.status !== "loading" && (
            <button
              type="button"
              className="brew-refresh"
              onClick={() => void brew.refresh()}
              title="Generate a fresh briefing now"
            >
              <span className="brew-refresh-spark">✦</span> {headRefreshLabel}
            </button>
          )}
        </div>
      </div>

      <div className="brew-body">
        <div className="brew-narrative">
          <BrewNarrative
            apiKey={apiKey}
            status={brew.status}
            text={brew.text}
            error={brew.error}
            onAddKey={onAddAnthropicKey}
            onBrew={() => void brew.refresh()}
          />
        </div>

        <div className="brew-pulse-wrap">
          <div className="brew-pulse-head">
            <span className="brew-pulse-label">
              <span className="brew-pulse-spark" aria-hidden="true">⌁</span> Stack Pulse · 24h
            </span>
            <span className="brew-pulse-stat">
              {totalActivity24h} {totalActivity24h === 1 ? "event" : "events"}
              {errorTools > 0 && (
                <span className="brew-pulse-err">
                  {" "}
                  · {errorTools} hot
                </span>
              )}
            </span>
          </div>
          <StackPulse
            tracks={tracks}
            stackTools={stackTools}
            onOpenTool={onOpenTool}
          />
        </div>
      </div>
    </section>
  );
}

interface NarrativeProps {
  apiKey: string | null;
  status: "idle" | "loading" | "ready" | "error";
  text: string | null;
  error: string | null;
  onAddKey: () => void;
  onBrew: () => void;
}

function BrewNarrative({
  apiKey,
  status,
  text,
  error,
  onAddKey,
  onBrew,
}: NarrativeProps) {
  // No key — onboarding stub. Cheap pitch (1¢ per brew is honest based on
  // Sonnet 4.5 pricing for the ~600-input/300-output token shape we use).
  if (!apiKey) {
    return (
      <div className="brew-stub">
        <div className="brew-stub-headline">
          <Icon.note /> Wake up to your stack.
        </div>
        <p className="brew-stub-copy">
          Add an Anthropic key to get a one-paragraph briefing across your connected
          tools. You brew it on demand — about 1¢ a pop, never auto-spent.
        </p>
        <button type="button" className="primary-btn small" onClick={onAddKey}>
          Add Anthropic key
        </button>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="brew-loading" aria-live="polite">
        <div className="brew-loading-label">
          <span className="brew-refresh-spark">✦</span> Brewing today's briefing…
        </div>
        <div className="skeleton-line w-90" />
        <div className="skeleton-line w-80" />
        <div className="skeleton-line w-50" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="brew-error">
        <div className="brew-error-head">Couldn&apos;t reach Anthropic</div>
        <code className="brew-error-msg">{error ?? "unknown error"}</code>
        <button type="button" className="ghost-btn small" onClick={onBrew}>
          Retry
        </button>
      </div>
    );
  }

  if (status === "ready" && text) {
    return <p className="brew-text">{renderWithBold(text)}</p>;
  }

  // status === "idle" — key present, never brewed.
  return (
    <div className="brew-stub">
      <div className="brew-stub-headline">
        <Icon.note /> Brew today's briefing.
      </div>
      <p className="brew-stub-copy">
        One paragraph summarizing what's worth your attention across your stack.
        Cached for the day — refresh whenever something changes.
      </p>
      <button type="button" className="primary-btn small" onClick={onBrew}>
        <span className="brew-refresh-spark">✦</span> Brew now
      </button>
    </div>
  );
}

// Inline **bold** → <strong>. Same renderer the Investigate panel uses;
// duplicated here to keep MorningBrew self-contained.
function renderWithBold(text: string): (string | ReactElement)[] {
  const parts: (string | ReactElement)[] = [];
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
