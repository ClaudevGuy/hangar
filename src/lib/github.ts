// Browser-only GitHub REST client. CORS-enabled by GitHub for these endpoints.
// Tokens come from the user's local vault — we never proxy them through a server.

export interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  public_repos: number;
  followers: number;
  following: number;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  pushed_at: string;
  private: boolean;
}

const BASE = "https://api.github.com";

function headers(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function getJson<T>(url: string, token: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { headers: headers(token), signal });
  if (!res.ok) {
    let detail = "";
    try {
      const body = (await res.json()) as { message?: string };
      if (body.message) detail = ` — ${body.message}`;
    } catch {
      // body wasn't JSON; ignore
    }
    throw new Error(`${res.status} ${res.statusText}${detail}`);
  }
  return (await res.json()) as T;
}

export function fetchGitHubUser(token: string, signal?: AbortSignal): Promise<GitHubUser> {
  return getJson<GitHubUser>(`${BASE}/user`, token, signal);
}

export function fetchGitHubRepos(token: string, signal?: AbortSignal): Promise<GitHubRepo[]> {
  // Sort by recently-pushed; ?affiliation=owner means only repos the token's user owns.
  const url = `${BASE}/user/repos?sort=pushed&direction=desc&per_page=8&affiliation=owner,collaborator`;
  return getJson<GitHubRepo[]>(url, token, signal);
}

// Per-event activity record from /users/:user/events. We only model the
// fields we actually consume — the full payload is enormous and varies by
// event type. Each event has a created_at that's accurate to the second,
// which is what makes this endpoint useful for the Stack Pulse waveform
// (versus /user/repos which collapses every push on a repo into a single
// pushed_at timestamp).
export interface GitHubEvent {
  id: string;
  // PushEvent | PullRequestEvent | IssuesEvent | IssueCommentEvent | etc.
  // We don't restrict to a closed union — GitHub adds new event types
  // periodically and we only key off `type` for display weighting.
  type: string;
  created_at: string;
  repo: { id: number; name: string; url: string };
  payload?: {
    // PushEvent: list of commits in this push. Often >1 — a single push
    // counts as 1 waveform bar regardless, since we treat the push as
    // the atomic activity unit.
    commits?: Array<{ sha: string; message: string }>;
    // PullRequestEvent: opened / closed / reopened / etc.
    action?: string;
  };
}

export function fetchGitHubEvents(
  username: string,
  token: string,
  signal?: AbortSignal,
): Promise<GitHubEvent[]> {
  // Up to 100 most recent events for the user (max page size). 24h-old
  // events very rarely exceed 100 unless the user is hyper-active, and
  // we only keep events inside the 24h window anyway.
  const url = `${BASE}/users/${encodeURIComponent(username)}/events?per_page=100`;
  return getJson<GitHubEvent[]>(url, token, signal);
}
