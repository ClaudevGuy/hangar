import { useLinearData } from "./useLinearData";
import { useSentryData } from "./useSentryData";
import { useVercelData } from "./useVercelData";
import type { SecretsMap } from "../types";

export type IncidentSeverity = "critical" | "warning" | "info";

export interface Incident {
  id: string;
  source: "vercel" | "sentry" | "linear";
  severity: IncidentSeverity;
  title: string;
  context?: string;
  url?: string;
  occurredAt: number;
}

export interface IncidentFeed {
  incidents: Incident[];
  loading: boolean;
  hasAnyToken: boolean;
}

const SEVERITY_RANK: Record<IncidentSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

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

  for (const d of vercel.deployments) {
    if (d.created < cutoff) continue;
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
    });
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

  return { incidents, loading, hasAnyToken };
}

function joinContext(parts: Array<string | null | undefined>): string | undefined {
  const filtered = parts.filter((p): p is string => Boolean(p));
  return filtered.length > 0 ? filtered.join(" · ") : undefined;
}
