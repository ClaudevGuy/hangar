// Vercel REST client. CORS-enabled with a personal access token.
// Token at https://vercel.com/account/tokens — give it read scope.

export interface VercelUser {
  id: string;
  username: string;
  name: string | null;
  email: string;
  avatar: string | null;
}

export interface VercelProject {
  id: string;
  name: string;
  framework: string | null;
  // unix-ms timestamps
  updatedAt: number;
  createdAt: number;
  // Most recent production deployment URL when Vercel surfaces one.
  link?: { url?: string };
  targets?: { production?: { url?: string; alias?: string[] } };
}

export interface VercelDeployment {
  uid: string;
  name: string;
  url: string;
  state: "QUEUED" | "BUILDING" | "ERROR" | "INITIALIZING" | "READY" | "CANCELED" | "DELETED";
  created: number;
  meta?: { githubCommitMessage?: string; branch?: string };
  target?: "production" | null;
}

const BASE = "https://api.vercel.com";

function headers(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

async function getJson<T>(path: string, token: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: headers(token), signal });
  if (!res.ok) {
    let detail = "";
    try {
      const body = (await res.json()) as { error?: { message?: string } };
      if (body.error?.message) detail = ` — ${body.error.message}`;
    } catch {
      // body wasn't JSON; ignore
    }
    throw new Error(`${res.status} ${res.statusText}${detail}`);
  }
  return (await res.json()) as T;
}

export function fetchVercelUser(token: string, signal?: AbortSignal): Promise<VercelUser> {
  return getJson<{ user: VercelUser }>("/v2/user", token, signal).then((r) => r.user);
}

export function fetchVercelProjects(
  token: string,
  signal?: AbortSignal,
): Promise<VercelProject[]> {
  return getJson<{ projects: VercelProject[] }>(
    "/v9/projects?limit=8",
    token,
    signal,
  ).then((r) => r.projects);
}

export function fetchVercelDeployments(
  token: string,
  signal?: AbortSignal,
): Promise<VercelDeployment[]> {
  return getJson<{ deployments: VercelDeployment[] }>(
    "/v6/deployments?limit=5",
    token,
    signal,
  ).then((r) => r.deployments);
}
