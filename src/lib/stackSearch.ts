// Stack-wide search — one query, multiple tools queried in parallel from
// the browser using the user's vault tokens. Each provider returns a uniform
// SearchHit shape so the modal can render a single ranked list.
//
// Browser-direct only (CORS-friendly): GitHub, Vercel, Linear today. Sentry
// can be added once we plumb through the org slug; Stripe needs a server
// proxy we don't have. Providers self-skip when their token is missing.

export type SearchHitType =
  | "deploy"
  | "issue"
  | "pr"
  | "repo"
  | "event"
  | "customer"
  | "charge"
  | "note";

export interface SearchHit {
  toolId: string;
  type: SearchHitType;
  title: string;
  subtitle?: string;
  url: string;
  // unix-ms; used as a tiebreaker for ranking. Optional because some tools
  // don't expose a sortable timestamp on every result.
  timestamp?: number;
}

export interface ProviderResult {
  toolId: string;
  status: "ok" | "skipped" | "error";
  hits: SearchHit[];
  error?: string;
}

export interface SearchProvider {
  toolId: string;
  // Returns null if disabled (no token); otherwise the result block.
  search(query: string, signal: AbortSignal): Promise<ProviderResult | null>;
}

// ─────────────────────────────────────────────────────────────────────────
// GitHub provider — searches issues/PRs/repos that the token's user owns or
// has access to. Uses the /search/issues + /search/repositories endpoints.
// ─────────────────────────────────────────────────────────────────────────

interface GhSearchIssueItem {
  title: string;
  html_url: string;
  state: string;
  pull_request?: unknown;
  repository_url: string;
  updated_at: string;
}
interface GhSearchRepoItem {
  full_name: string;
  description: string | null;
  html_url: string;
  pushed_at: string;
}

export function makeGitHubProvider(token: string | null): SearchProvider {
  return {
    toolId: "github",
    async search(query, signal) {
      if (!token) return null;
      try {
        // Constrain to the authenticated user's involvement so results stay
        // relevant. `involves:@me` works inside `q=`.
        const issuesUrl =
          "https://api.github.com/search/issues?per_page=6&q=" +
          encodeURIComponent(`${query} involves:@me`);
        const reposUrl =
          "https://api.github.com/search/repositories?per_page=4&q=" +
          encodeURIComponent(`${query} user:@me`);
        const headers: HeadersInit = {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        };
        const [issuesRes, reposRes] = await Promise.all([
          fetch(issuesUrl, { headers, signal }),
          fetch(reposUrl, { headers, signal }),
        ]);
        const hits: SearchHit[] = [];
        if (issuesRes.ok) {
          const body = (await issuesRes.json()) as { items: GhSearchIssueItem[] };
          for (const it of body.items ?? []) {
            const isPr = !!it.pull_request;
            const repo = it.repository_url.replace(/^https?:\/\/api\.github\.com\/repos\//, "");
            hits.push({
              toolId: "github",
              type: isPr ? "pr" : "issue",
              title: it.title,
              subtitle: `${repo} · ${it.state}`,
              url: it.html_url,
              timestamp: Date.parse(it.updated_at) || undefined,
            });
          }
        }
        if (reposRes.ok) {
          const body = (await reposRes.json()) as { items: GhSearchRepoItem[] };
          for (const r of body.items ?? []) {
            hits.push({
              toolId: "github",
              type: "repo",
              title: r.full_name,
              subtitle: r.description ?? "—",
              url: r.html_url,
              timestamp: Date.parse(r.pushed_at) || undefined,
            });
          }
        }
        if (!issuesRes.ok && !reposRes.ok) {
          return {
            toolId: "github",
            status: "error",
            hits: [],
            error: `GitHub: ${issuesRes.status} ${issuesRes.statusText}`,
          };
        }
        return { toolId: "github", status: "ok", hits };
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") throw err;
        return {
          toolId: "github",
          status: "error",
          hits: [],
          error: err instanceof Error ? err.message : "fetch failed",
        };
      }
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Vercel provider — Vercel doesn't offer a real search API, so we list the
// 50 most recent deployments + projects and filter client-side. Good enough
// for a "where did I deploy that" lookup; cheap because the JSON is small.
// ─────────────────────────────────────────────────────────────────────────

interface VercelDep {
  uid: string;
  name: string;
  url: string;
  state: string;
  created: number;
  meta?: { githubCommitMessage?: string; branch?: string };
  target?: "production" | null;
}
interface VercelProj {
  id: string;
  name: string;
  framework: string | null;
  updatedAt: number;
}

export function makeVercelProvider(token: string | null): SearchProvider {
  return {
    toolId: "vercel",
    async search(query, signal) {
      if (!token) return null;
      const q = query.toLowerCase();
      try {
        const headers: HeadersInit = { Authorization: `Bearer ${token}` };
        const [depsRes, projRes] = await Promise.all([
          fetch("https://api.vercel.com/v6/deployments?limit=50", { headers, signal }),
          fetch("https://api.vercel.com/v9/projects?limit=20", { headers, signal }),
        ]);
        const hits: SearchHit[] = [];
        if (depsRes.ok) {
          const body = (await depsRes.json()) as { deployments: VercelDep[] };
          for (const d of body.deployments ?? []) {
            const haystack = [
              d.name,
              d.url,
              d.meta?.githubCommitMessage ?? "",
              d.meta?.branch ?? "",
              d.target ?? "",
              d.state,
            ]
              .join(" ")
              .toLowerCase();
            if (!haystack.includes(q)) continue;
            hits.push({
              toolId: "vercel",
              type: "deploy",
              title: d.meta?.githubCommitMessage || d.name,
              subtitle: `${d.name} · ${d.state}${d.target === "production" ? " · prod" : ""}`,
              url: `https://${d.url}`,
              timestamp: d.created,
            });
            if (hits.length >= 8) break;
          }
        }
        if (projRes.ok) {
          const body = (await projRes.json()) as { projects: VercelProj[] };
          for (const p of body.projects ?? []) {
            if (!p.name.toLowerCase().includes(q)) continue;
            hits.push({
              toolId: "vercel",
              type: "repo",
              title: p.name,
              subtitle: p.framework ?? "project",
              url: `https://vercel.com/dashboard?project=${encodeURIComponent(p.name)}`,
              timestamp: p.updatedAt,
            });
          }
        }
        if (!depsRes.ok && !projRes.ok) {
          return {
            toolId: "vercel",
            status: "error",
            hits: [],
            error: `Vercel: ${depsRes.status} ${depsRes.statusText}`,
          };
        }
        return { toolId: "vercel", status: "ok", hits };
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") throw err;
        return {
          toolId: "vercel",
          status: "error",
          hits: [],
          error: err instanceof Error ? err.message : "fetch failed",
        };
      }
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Linear provider — GraphQL `issues(filter:{ ... })` with case-insensitive
// title/description match. Returns top 10 by updatedAt.
// ─────────────────────────────────────────────────────────────────────────

const LINEAR_SEARCH = `
  query Search($q: String!) {
    issues(
      first: 10,
      orderBy: updatedAt,
      filter: {
        or: [
          { title: { containsIgnoreCase: $q } },
          { description: { containsIgnoreCase: $q } }
        ]
      }
    ) {
      nodes {
        identifier
        title
        url
        state { name }
        updatedAt
      }
    }
  }
`;

interface LinearIssueNode {
  identifier: string;
  title: string;
  url: string;
  state: { name: string };
  updatedAt: string;
}

export function makeLinearProvider(token: string | null): SearchProvider {
  return {
    toolId: "linear",
    async search(query, signal) {
      if (!token) return null;
      try {
        const res = await fetch("https://api.linear.app/graphql", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token, // bare token, no "Bearer " prefix for Linear
          },
          body: JSON.stringify({ query: LINEAR_SEARCH, variables: { q: query } }),
          signal,
        });
        if (!res.ok) {
          return {
            toolId: "linear",
            status: "error",
            hits: [],
            error: `Linear: ${res.status} ${res.statusText}`,
          };
        }
        const body = (await res.json()) as {
          data?: { issues: { nodes: LinearIssueNode[] } };
          errors?: { message: string }[];
        };
        if (body.errors?.length) {
          return {
            toolId: "linear",
            status: "error",
            hits: [],
            error: `Linear: ${body.errors[0]!.message}`,
          };
        }
        const hits: SearchHit[] = (body.data?.issues.nodes ?? []).map((n) => ({
          toolId: "linear",
          type: "issue",
          title: `${n.identifier} · ${n.title}`,
          subtitle: n.state.name,
          url: n.url,
          timestamp: Date.parse(n.updatedAt) || undefined,
        }));
        return { toolId: "linear", status: "ok", hits };
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") throw err;
        return {
          toolId: "linear",
          status: "error",
          hits: [],
          error: err instanceof Error ? err.message : "fetch failed",
        };
      }
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Notes provider — local-only. Searches the user's contextual notes
// (per-tool only for v1, since they have a clean parent-tool to anchor a
// click). Reads directly from localStorage so it doesn't need React state.
// ─────────────────────────────────────────────────────────────────────────

interface StoredNoteScope {
  kind: "tool" | "incident";
  toolId?: string;
  incidentId?: string;
}
interface StoredNote {
  id: string;
  text: string;
  scope: StoredNoteScope;
  updatedAt: number;
}

function loadAllNotes(): StoredNote[] {
  try {
    const active = localStorage.getItem("hangar-active-workspace") ?? "default";
    const raw = localStorage.getItem(`hangar-notes-${active}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as StoredNote[];
  } catch {
    return [];
  }
}

export function makeNotesProvider(allToolAccountUrls: Record<string, string>): SearchProvider {
  return {
    toolId: "notes",
    async search(query) {
      const q = query.trim().toLowerCase();
      if (!q) return { toolId: "notes", status: "ok", hits: [] };
      const allNotes = loadAllNotes();
      const matched = allNotes
        .filter(
          (n) =>
            n.scope.kind === "tool" &&
            typeof n.scope.toolId === "string" &&
            n.text.toLowerCase().includes(q),
        )
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 6);
      const hits: SearchHit[] = matched.map((n) => {
        const toolId = n.scope.toolId!;
        // Truncate to a single-line preview; the card title can't wrap nicely.
        const preview = n.text.replace(/\s+/g, " ").slice(0, 80);
        return {
          toolId,
          type: "note" as const,
          title: preview,
          subtitle: "your note",
          url: allToolAccountUrls[toolId] ?? "#",
          timestamp: n.updatedAt,
        };
      });
      return { toolId: "notes", status: "ok", hits };
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Orchestrator — run all enabled providers in parallel, return the streamed
// list of provider results. The modal can render incrementally as each
// provider settles.
// ─────────────────────────────────────────────────────────────────────────

export interface RunSearchOptions {
  query: string;
  providers: SearchProvider[];
  signal: AbortSignal;
  // Called as each provider finishes (or is skipped). Lets the UI render
  // results incrementally rather than waiting on the slowest one.
  onProviderSettled: (result: ProviderResult) => void;
}

export async function runSearch({
  query,
  providers,
  signal,
  onProviderSettled,
}: RunSearchOptions): Promise<void> {
  const work = providers.map(async (p) => {
    try {
      const r = await p.search(query, signal);
      if (signal.aborted) return;
      onProviderSettled(
        r ?? { toolId: p.toolId, status: "skipped", hits: [] },
      );
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      onProviderSettled({
        toolId: p.toolId,
        status: "error",
        hits: [],
        error: err instanceof Error ? err.message : "fetch failed",
      });
    }
  });
  await Promise.all(work);
}
