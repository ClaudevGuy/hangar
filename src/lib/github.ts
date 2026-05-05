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
