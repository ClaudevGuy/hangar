import { useLinearData } from "./useLinearData";
import { useSentryData } from "./useSentryData";
import { useVercelData } from "./useVercelData";
import type { LinearIssue } from "../lib/linear";
import type { SentryIssue } from "../lib/sentry";
import type { VercelDeployment } from "../lib/vercel";
import type { SecretsMap } from "../types";

export type IncidentSeverity = "critical" | "warning" | "info";

// Discriminated union of the original record that produced this
// incident — used by the AI Action ("Investigate") flow to feed Claude the
// full structured detail without re-fetching.
export type IncidentRaw =
  | { kind: "vercel-deploy"; data: VercelDeployment }
  | { kind: "sentry-issue"; data: SentryIssue }
  | { kind: "linear-issue"; data: LinearIssue }
  | {
      kind: "token-expiry";
      data: {
        toolId: string;
        keyId: string;
        label: string;
        expiresAt: number;
        daysLeft: number;
      };
    };

export interface Incident {
  id: string;
  // Tool id this incident is attached to. The Today panel uses this to look
  // up + render the right tool logo on the row. Token-expiry incidents use
  // the affected tool's id (e.g. "github" for an expiring GitHub PAT).
  source: string;
  severity: IncidentSeverity;
  title: string;
  context?: string;
  url?: string;
  occurredAt: number;
  raw: IncidentRaw;
}

export interface IncidentFeed {
  incidents: Incident[];
  loading: boolean;
  hasAnyToken: boolean;
  // Recent provider activity surfaced for cross-tool correlation in the
  // Investigate flow. These are the same arrays the per-tool drawers see —
  // shared cache, no extra fetch.
  vercelDeployments: VercelDeployment[];
  sentryIssues: SentryIssue[];
  linearIssues: LinearIssue[];
}

const SEVERITY_RANK: Record<IncidentSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Aggregates "things that need attention" from the connected providers into
// a single ordered feed. Each per-tool data hook short-circuits to IDLE when
// its token is null, so calling all of them unconditionally is safe.
export function useIncidents(secrets: SecretsMap): IncidentFeed {
  const vercelToken = secrets["vercel"]?.find((k) => k.value)?.value || null;
  const linearToken = secrets["linear"]?.find((k) => k.value)?.value || null;
  const sentryToken = secrets["sentry"]?.find((k) => k.value)?.value || null;

  const vercel = useVercelData(vercelToken);
  const linear = useLinearData(linearToken);
  const sentry = useSentryData(sentryToken);

  const incidents: Incident[] = [];
  const cutoff = Date.now() - SEVEN_DAYS_MS;

  // Auto-resolve old Vercel failures: a failed deploy isn't an "issue to look
  // at" once a newer successful deploy of the same project + target has gone
  // out. Build a (project + target) → latest-success-time map first, then skip
  // any ERROR/CANCELED whose created < that map's value for the same key.
  const latestSuccess = new Map<string, number>();
  for (const d of vercel.deployments) {
    if (d.state !== "READY") continue;
    const key = `${d.name}::${d.target ?? "preview"}`;
    const cur = latestSuccess.get(key) ?? 0;
    if (d.created > cur) latestSuccess.set(key, d.created);
  }

  for (const d of vercel.deployments) {
    if (d.created < cutoff) continue;
    if (d.state === "ERROR" || d.state === "CANCELED") {
      const key = `${d.name}::${d.target ?? "preview"}`;
      const supersededAt = latestSuccess.get(key) ?? 0;
      if (d.created < supersededAt) continue; // a later success exists — drop
    }
    if (d.state === "ERROR") {
      incidents.push({
        id: `vercel-${d.uid}`,
        source: "vercel",
        severity: "critical",
        title: `${d.name} · deploy failed`,
        context: joinContext([
          d.meta?.branch ?? null,
          d.target === "production" ? "prod" : null,
        ]),
        url: vercel.user?.username
          ? `https://vercel.com/${vercel.user.username}/${d.name}`
          : undefined,
        occurredAt: d.created,
        raw: { kind: "vercel-deploy", data: d },
      });
    } else if (d.state === "CANCELED") {
      incidents.push({
        id: `vercel-${d.uid}`,
        source: "vercel",
        severity: "warning",
        title: `${d.name} · deploy canceled`,
        context: joinContext([d.meta?.branch ?? null]),
        url: vercel.user?.username
          ? `https://vercel.com/${vercel.user.username}/${d.name}`
          : undefined,
        occurredAt: d.created,
        raw: { kind: "vercel-deploy", data: d },
      });
    }
  }

  for (const issue of sentry.issues) {
    const isCritical = issue.level === "fatal" || issue.level === "error";
    incidents.push({
      id: `sentry-${issue.id}`,
      source: "sentry",
      severity: isCritical ? "critical" : "warning",
      title: issue.title,
      context: joinContext([
        issue.project.slug,
        `${Number(issue.count).toLocaleString()} events`,
      ]),
      url: issue.permalink,
      occurredAt: new Date(issue.lastSeen).getTime(),
      raw: { kind: "sentry-issue", data: issue },
    });
  }

  for (const issue of linear.issues) {
    if (issue.priority !== 1) continue;
    if (issue.state.type === "completed" || issue.state.type === "canceled") continue;
    incidents.push({
      id: `linear-${issue.id}`,
      source: "linear",
      severity: "critical",
      title: `${issue.identifier} · ${issue.title}`,
      context: joinContext([issue.team.key, issue.state.name]),
      url: issue.url,
      occurredAt: new Date(issue.updatedAt).getTime(),
      raw: { kind: "linear-issue", data: issue },
    });
  }

  // ── Token expiry — surface vault keys nearing expiration so they get
  // rotated before they 401. Iterate every stored secret across all tools;
  // emit an incident if expiresAt is within the alert window (14 days) or
  // already past. Severity scales with how close (or how overdue) it is.
  const now = Date.now();
  const expiryAlertWindow = now + FOURTEEN_DAYS_MS;
  for (const [toolId, entries] of Object.entries(secrets)) {
    if (!Array.isArray(entries)) continue;
    for (const entry of entries) {
      if (typeof entry.expiresAt !== "number") continue;
      if (entry.expiresAt > expiryAlertWindow) continue;
      // Skip very old expirations (>30 days past) — user has clearly
      // moved on; no point keeping a forever-stale row.
      if (entry.expiresAt < now - 30 * ONE_DAY_MS) continue;

      const daysLeft = Math.round((entry.expiresAt - now) / ONE_DAY_MS);
      const expired = daysLeft < 0;
      const severity: IncidentSeverity =
        expired || daysLeft <= 1 ? "critical"
        : daysLeft <= 7 ? "warning"
        : "info";

      const friendly = toolId === "github" ? "GitHub"
        : toolId === "anthropic" ? "Anthropic"
        : toolId.charAt(0).toUpperCase() + toolId.slice(1);
      const title = expired
        ? `${friendly} token expired ${Math.abs(daysLeft)}d ago`
        : daysLeft === 0
          ? `${friendly} token expires today`
          : `${friendly} token expires in ${daysLeft} ${daysLeft === 1 ? "day" : "days"}`;

      incidents.push({
        id: `expiry-${toolId}-${entry.id}`,
        source: toolId,
        severity,
        title,
        context: joinContext([entry.label, expired ? "rotate now" : "vault"]),
        // No URL — clicking the row falls through to opening the tool's
        // drawer, which has an "Add key" / "Manage keys" entry point.
        occurredAt: entry.expiresAt,
        raw: {
          kind: "token-expiry",
          data: { toolId, keyId: entry.id, label: entry.label, expiresAt: entry.expiresAt, daysLeft },
        },
      });
    }
  }

  incidents.sort((a, b) => {
    const diff = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    if (diff !== 0) return diff;
    return b.occurredAt - a.occurredAt;
  });

  const hasAnyToken = !!(vercelToken || linearToken || sentryToken);
  const loading =
    (!!vercelToken && vercel.loading) ||
    (!!linearToken && linear.loading) ||
    (!!sentryToken && sentry.loading);

  return {
    incidents,
    loading,
    hasAnyToken,
    vercelDeployments: vercel.deployments,
    sentryIssues: sentry.issues,
    linearIssues: linear.issues,
  };
}

function joinContext(parts: Array<string | null | undefined>): string | undefined {
  const filtered = parts.filter((p): p is string => Boolean(p));
  return filtered.length > 0 ? filtered.join(" · ") : undefined;
}
