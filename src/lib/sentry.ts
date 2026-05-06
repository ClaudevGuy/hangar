// Sentry REST client. Goes through the local /api/sentry proxy because
// sentry.io's API blocks browser CORS by default unless the org allowlists
// the origin. Token at https://sentry.io/settings/account/api/auth-tokens/
// (needs at least org:read, project:read, event:read).

export interface SentryOrganization {
  id: string;
  slug: string;
  name: string;
}

export interface SentryProject {
  id: string;
  name: string;
  slug: string;
}

export interface SentryIssue {
  id: string;
  shortId: string;
  title: string;
  culprit?: string;
  permalink: string;
  level: string;
  status: string;
  count: string;
  userCount: number;
  lastSeen: string;
  firstSeen: string;
  project: SentryProject;
}

const PROXY = "/api/sentry";

function headers(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

async function getJson<T>(path: string, token: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${PROXY}${path}`, { headers: headers(token), signal });
  if (!res.ok) {
    let detail = "";
    try {
      const body = (await res.json()) as { detail?: string; error?: string };
      const msg = body.detail ?? body.error;
      if (msg) detail = ` — ${msg}`;
    } catch {
      // Body wasn't JSON; ignore.
    }
    throw new Error(`${res.status} ${res.statusText}${detail}`);
  }
  return (await res.json()) as T;
}

export function fetchSentryOrgs(
  token: string,
  signal?: AbortSignal,
): Promise<SentryOrganization[]> {
  return getJson<SentryOrganization[]>("/organizations/", token, signal);
}

export function fetchSentryIssues(
  orgSlug: string,
  token: string,
  signal?: AbortSignal,
): Promise<SentryIssue[]> {
  // 14d window catches intermittent issues on low-traffic projects;
  // limit=10 + we slice to 6 for display, leaving headroom if any are stale.
  const query = encodeURIComponent("is:unresolved");
  return getJson<SentryIssue[]>(
    `/organizations/${encodeURIComponent(orgSlug)}/issues/?statsPeriod=14d&limit=10&query=${query}`,
    token,
    signal,
  );
}
