// Unified activity log — flattens every provider's recent records into a
// single chronologically-sorted stream the LogsModal can render. Pure
// function; takes the IncidentFeed (which the per-tool data hooks already
// populate) and returns a typed list. No fetches.

import type { IncidentFeed } from "../hooks/useIncidents";

export type LogStatus = "ok" | "warn" | "err" | "info";

export interface LogEntry {
  // Stable id derived from provider + record id so React keys + dismiss
  // tracking stay consistent across re-renders.
  id: string;
  toolId: string;
  // One-word kind for filter chips and per-row badges.
  kind: "deploy" | "push" | "pr" | "issue" | "error" | "ticket" | "ai";
  // Headline shown on the row's first line.
  title: string;
  // Optional secondary line (branch, project, commit message excerpt).
  context?: string;
  // ms since epoch — single field used for both display and sorting.
  timestamp: number;
  url?: string;
  status: LogStatus;
}

const TWENTY_FOUR_H = 24 * 60 * 60 * 1000;
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

// Maps Vercel deploy state to a status tone the LogsModal uses for
// per-row colour. READY = ok; ERROR = err; CANCELED = warn; everything
// else (BUILDING/QUEUED/INITIALIZING) is "info" since those are
// in-flight neither-good-nor-bad signals.
function vercelStatusOf(state: string): LogStatus {
  if (state === "READY") return "ok";
  if (state === "ERROR") return "err";
  if (state === "CANCELED") return "warn";
  return "info";
}

function sentryStatusOf(level: string): LogStatus {
  if (level === "fatal" || level === "error") return "err";
  if (level === "warning") return "warn";
  return "info";
}

function linearStatusOf(priority: number): LogStatus {
  if (priority === 1) return "err"; // urgent
  if (priority === 2) return "warn"; // high
  return "info";
}

// Friendlier labels for GitHub event types. These cover ~99% of the
// stream we'll see (push + PR + issue + comment + create); anything
// outside falls through with the raw type name.
function describeGitHubEvent(type: string, payload?: { action?: string }): string | null {
  switch (type) {
    case "PushEvent":
      return "Pushed";
    case "PullRequestEvent":
      return payload?.action ? `PR ${payload.action}` : "PR activity";
    case "IssuesEvent":
      return payload?.action ? `Issue ${payload.action}` : "Issue activity";
    case "IssueCommentEvent":
      return "Comment on issue";
    case "PullRequestReviewEvent":
      return payload?.action ? `Review ${payload.action}` : "PR review";
    case "PullRequestReviewCommentEvent":
      return "Comment on PR review";
    case "CreateEvent":
      return "Branch / tag created";
    case "DeleteEvent":
      return "Branch / tag deleted";
    case "ForkEvent":
      return "Forked";
    case "WatchEvent":
      return "Starred";
    case "ReleaseEvent":
      return payload?.action === "published" ? "Released" : "Release activity";
    default:
      return null;
  }
}

// Friendly headline per Anthropic call kind. Each is short enough to read
// as a one-liner in the Logs row.
function anthropicTitleOf(kind: string): string {
  switch (kind) {
    case "brief":       return "Brief generated";
    case "brew":        return "Morning Brew refreshed";
    case "ask":         return "Ask question answered";
    case "investigate": return "Incident investigated";
    default:            return "Claude call";
  }
}

// Coerces a GitHub event type to one of our internal kinds. Anything not
// explicitly mapped becomes "push" so it still renders (filter chips will
// still work; users can filter by tool instead of kind to find it).
function githubKindOf(type: string): LogEntry["kind"] {
  if (type === "PushEvent") return "push";
  if (type.startsWith("PullRequest")) return "pr";
  if (type.startsWith("Issue")) return "issue";
  return "push";
}

export function buildActivityLog(feed: IncidentFeed): LogEntry[] {
  const now = Date.now();
  const cutoff = now - SEVEN_DAYS;
  const entries: LogEntry[] = [];

  // ── Vercel deployments ──────────────────────────────────────────────
  for (const d of feed.vercelDeployments) {
    if (d.created < cutoff) continue;
    const status = vercelStatusOf(d.state);
    const stateLabel = d.state.toLowerCase();
    const branch = d.meta?.branch ?? null;
    const target = d.target === "production" ? "prod" : null;
    const ctxParts = [branch, target, stateLabel].filter(Boolean) as string[];
    entries.push({
      id: `vercel-${d.uid}`,
      toolId: "vercel",
      kind: "deploy",
      title: `${d.name} · ${stateLabel}`,
      context: ctxParts.join(" · ") || undefined,
      timestamp: d.created,
      url: d.url ? `https://${d.url}` : undefined,
      status,
    });
  }

  // ── GitHub events ───────────────────────────────────────────────────
  // Per-event timestamps (push, PR, issues, comments). We render the
  // repo's short name (org/repo) as the title with the action verb as
  // the context line.
  for (const ev of feed.githubEvents) {
    const ts = new Date(ev.created_at).getTime();
    if (ts < cutoff) continue;
    const verb = describeGitHubEvent(ev.type, ev.payload);
    if (!verb) continue; // unknown type — skip noise
    const commitCount = ev.payload?.commits?.length ?? 0;
    const commitTail = ev.type === "PushEvent" && commitCount > 0
      ? ` · ${commitCount} ${commitCount === 1 ? "commit" : "commits"}`
      : "";
    const firstCommit = ev.payload?.commits?.[0]?.message?.split("\n")[0] ?? null;
    entries.push({
      id: `github-${ev.id}`,
      toolId: "github",
      kind: githubKindOf(ev.type),
      title: `${verb} · ${ev.repo.name}`,
      context: firstCommit ? `${firstCommit}${commitTail}` : commitTail.replace(/^ · /, "") || undefined,
      timestamp: ts,
      url: `https://github.com/${ev.repo.name}`,
      status: "info",
    });
  }

  // ── Sentry issues ───────────────────────────────────────────────────
  for (const issue of feed.sentryIssues) {
    const ts = new Date(issue.lastSeen).getTime();
    if (ts < cutoff) continue;
    const events = Number(issue.count);
    const eventsLabel = Number.isFinite(events) && events > 0
      ? `${events.toLocaleString()} events`
      : "issue";
    entries.push({
      id: `sentry-${issue.id}`,
      toolId: "sentry",
      kind: "error",
      title: issue.title,
      context: `${issue.project.slug} · ${eventsLabel} · ${issue.level}`,
      timestamp: ts,
      url: issue.permalink,
      status: sentryStatusOf(issue.level),
    });
  }

  // ── Linear issues ───────────────────────────────────────────────────
  for (const issue of feed.linearIssues) {
    const ts = new Date(issue.updatedAt).getTime();
    if (ts < cutoff) continue;
    entries.push({
      id: `linear-${issue.id}`,
      toolId: "linear",
      kind: "ticket",
      title: `${issue.identifier} · ${issue.title}`,
      context: `${issue.team.key} · ${issue.state.name}`,
      timestamp: ts,
      url: issue.url,
      status: linearStatusOf(issue.priority),
    });
  }

  // ── Anthropic API calls (Hangar's own) ──────────────────────────────
  // Each Brief / Brew / Ask / Investigate gets a row so the user can
  // see Anthropic activity (and approximate cost via tokens). No url —
  // these calls don't have a public-facing landing page.
  for (const ev of feed.anthropicEvents) {
    if (ev.timestamp < cutoff) continue;
    const tokens = (ev.inputTokens ?? 0) + (ev.outputTokens ?? 0);
    const ctxParts: string[] = [];
    if (ev.label) ctxParts.push(ev.label);
    if (tokens > 0) ctxParts.push(`${tokens.toLocaleString()} tokens`);
    entries.push({
      id: `anthropic-${ev.id}`,
      toolId: "anthropic",
      kind: "ai",
      title: anthropicTitleOf(ev.kind),
      context: ctxParts.join(" · ") || undefined,
      timestamp: ev.timestamp,
      status: "info",
    });
  }

  // Newest first. Stable sort isn't critical — entries from the same
  // tool already arrive sorted from their respective hooks.
  entries.sort((a, b) => b.timestamp - a.timestamp);
  return entries;
}

// Helper for the modal's "last 24h" header chip when we want to know
// what fraction of the log falls in the most-recent-day window.
export function countLast24h(entries: LogEntry[]): number {
  const cutoff = Date.now() - TWENTY_FOUR_H;
  let n = 0;
  for (const e of entries) if (e.timestamp >= cutoff) n++;
  return n;
}
