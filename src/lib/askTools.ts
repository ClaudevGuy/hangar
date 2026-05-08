// Browser-direct tool implementations for "Ask your stack". Mirror of the
// hangar-mcp tools in `mcp/`, but rebuilt to run in the browser using the
// user's vault tokens. Each tool returns rich structured data we can both
// hand to Claude as tool_result and surface in the UI as citations.

import { fetchGitHubUser, fetchGitHubRepos } from "./github";
import { fetchLinearIssues, fetchLinearViewer, type LinearIssue } from "./linear";
import { fetchSentryIssues, fetchSentryOrgs, type SentryIssue } from "./sentry";
import { fetchVercelDeployments, type VercelDeployment } from "./vercel";
import { monthlyTotal } from "./cost";
import type { ToolMetaMap } from "../hooks/useToolMeta";
import type { SecretsMap, Tool } from "../types";

// ─────────────────────────────────────────────────────────────────────────
// Tool input/output types
// ─────────────────────────────────────────────────────────────────────────

// A "Citation" is a structured pointer to something in a real tool that
// the UI can render as a clickable hit row beneath the assistant message.
// The shape mirrors stackSearch's SearchHit so we can reuse the styling.
export interface AskCitation {
  toolId: string;
  type: "deploy" | "issue" | "pr" | "repo" | "event";
  title: string;
  subtitle?: string;
  url: string;
  timestamp?: number;
}

// Wraps every tool's run-time output: a JSON-serializable summary for
// Claude (always present), plus optional citations the UI can show.
export interface ToolOutcome {
  summary: unknown;
  citations: AskCitation[];
}

export interface ToolContext {
  stackTools: Tool[];
  toolMeta: ToolMetaMap;
  secrets: SecretsMap;
}

export interface ToolDefinition {
  // Anthropic tool spec
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required: string[];
  };
  // Browser-side implementation. Throws Error on failure with a human
  // message; the loop converts errors to tool_result error strings so
  // Claude can recover.
  run(input: Record<string, unknown>, ctx: ToolContext, signal: AbortSignal): Promise<ToolOutcome>;
}

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

function token(ctx: ToolContext, toolId: string): string | null {
  const list = ctx.secrets[toolId];
  return list?.find((k) => k.value)?.value ?? null;
}

function requireToken(ctx: ToolContext, toolId: string, friendly: string): string {
  const t = token(ctx, toolId);
  if (!t) {
    throw new Error(
      `No ${friendly} token in the vault. Add one in Keys (search "${toolId}") and try again.`,
    );
  }
  return t;
}

function clampLimit(value: unknown, def: number, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return def;
  return Math.max(1, Math.min(max, Math.floor(value)));
}

// ─────────────────────────────────────────────────────────────────────────
// Tools
// ─────────────────────────────────────────────────────────────────────────

const READ_STACK: ToolDefinition = {
  name: "read_stack",
  description:
    "Read the user's pinned Hangar stack. Returns the list of pinned tools (id, name, category, plan, status) plus aggregated meta: pinned count, monthly cost roll-up (when plans are tagged), categories represented, and which tools have a key in the vault. Use to ground answers like 'what's in my stack?', 'how much do I spend?', or to know which integrations are wired up before calling other tools.",
  input_schema: { type: "object", properties: {}, required: [] },
  async run(_input, ctx) {
    const cost = monthlyTotal(ctx.stackTools, (id) => ctx.toolMeta[id]?.plan);
    const tools = ctx.stackTools.map((t) => ({
      id: t.id,
      name: t.name,
      category: t.category,
      plan: ctx.toolMeta[t.id]?.plan ?? t.plan ?? null,
      hasKey: (ctx.secrets[t.id]?.length ?? 0) > 0,
    }));
    return {
      summary: {
        pinnedCount: tools.length,
        categories: Array.from(new Set(tools.map((t) => t.category))),
        monthlyCostUsd: Math.round(cost.total),
        monthlyCostTrackedTools: cost.tracked,
        monthlyCostUntrackedTools: cost.untracked,
        tools,
      },
      citations: [],
    };
  },
};

const LIST_RECENT_DEPLOYS: ToolDefinition = {
  name: "list_recent_deploys",
  description:
    "List recent Vercel deployments. Optional filters: state (READY/ERROR/BUILDING/CANCELED), target (production/preview), limit (1-20, default 8). Use for 'failed deploys this week?', 'what shipped to prod?', or to correlate a deploy with a Sentry incident.",
  input_schema: {
    type: "object",
    properties: {
      state: {
        type: "string",
        description: "Filter by deployment state",
        enum: ["READY", "ERROR", "BUILDING", "CANCELED", "QUEUED"],
      },
      target: {
        type: "string",
        description: "Filter by deployment target",
        enum: ["production", "preview"],
      },
      limit: { type: "number", description: "Max number to return (1-20, default 8)" },
    },
    required: [],
  },
  async run(input, ctx, signal) {
    const tok = requireToken(ctx, "vercel", "Vercel");
    const limit = clampLimit(input.limit, 8, 20);
    const all: VercelDeployment[] = await fetchVercelDeployments(tok, signal);
    const filtered = all.filter((d) => {
      if (input.state && d.state !== input.state) return false;
      if (input.target && d.target !== input.target) return false;
      return true;
    });
    const top = filtered.slice(0, limit);
    return {
      summary: top.map((d) => ({
        name: d.name,
        state: d.state,
        target: d.target ?? null,
        url: d.url,
        commitMessage: d.meta?.githubCommitMessage ?? null,
        branch: d.meta?.branch ?? null,
        ageHours: Math.round((Date.now() - d.created) / 3_600_000),
      })),
      citations: top.map((d) => ({
        toolId: "vercel",
        type: "deploy" as const,
        title: d.meta?.githubCommitMessage || d.name,
        subtitle: `${d.name} · ${d.state}${d.target === "production" ? " · prod" : ""}`,
        url: `https://${d.url}`,
        timestamp: d.created,
      })),
    };
  },
};

const LIST_UNRESOLVED_ISSUES: ToolDefinition = {
  name: "list_unresolved_issues",
  description:
    "List unresolved Sentry issues across the user's first organization in the last 14 days. Optional: level (error/warning/fatal/info), limit (1-20, default 8). Use for 'what's broken?', 'errors I haven't fixed', or to correlate with deploys.",
  input_schema: {
    type: "object",
    properties: {
      level: {
        type: "string",
        description: "Filter by Sentry level",
        enum: ["error", "warning", "info", "fatal", "debug"],
      },
      limit: { type: "number", description: "Max number to return (1-20, default 8)" },
    },
    required: [],
  },
  async run(input, ctx, signal) {
    const tok = requireToken(ctx, "sentry", "Sentry");
    const orgs = await fetchSentryOrgs(tok, signal);
    if (orgs.length === 0) {
      return { summary: { issues: [], note: "No Sentry organizations on this token." }, citations: [] };
    }
    const limit = clampLimit(input.limit, 8, 20);
    const issues: SentryIssue[] = await fetchSentryIssues(orgs[0]!.slug, tok, signal);
    const filtered = input.level
      ? issues.filter((i) => i.level === input.level)
      : issues;
    const top = filtered.slice(0, limit);
    return {
      summary: {
        organization: orgs[0]!.name,
        issues: top.map((i) => ({
          shortId: i.shortId,
          title: i.title,
          project: i.project.slug,
          level: i.level,
          eventCount: Number(i.count),
          userCount: i.userCount,
          lastSeenHours: Math.round((Date.now() - new Date(i.lastSeen).getTime()) / 3_600_000),
          culprit: i.culprit ?? null,
        })),
      },
      citations: top.map((i) => ({
        toolId: "sentry",
        type: "issue" as const,
        title: `${i.shortId} · ${i.title}`,
        subtitle: `${i.project.slug} · ${i.level} · ${i.count} events · ${i.userCount} users`,
        url: i.permalink,
        timestamp: new Date(i.lastSeen).getTime(),
      })),
    };
  },
};

const LIST_ASSIGNED_ISSUES: ToolDefinition = {
  name: "list_assigned_issues",
  description:
    "List Linear issues assigned to the authenticated user. Optional priority filter (1=urgent, 2=high, 3=medium, 4=low). Use for 'my queue', 'urgent tickets', 'what should I pick up next?'.",
  input_schema: {
    type: "object",
    properties: {
      priority: {
        type: "number",
        description: "Filter by Linear priority (1=urgent, 2=high, 3=medium, 4=low)",
      },
      limit: { type: "number", description: "Max number to return (1-20, default 8)" },
    },
    required: [],
  },
  async run(input, ctx, signal) {
    const tok = requireToken(ctx, "linear", "Linear");
    const limit = clampLimit(input.limit, 8, 20);
    const [viewer, issues] = await Promise.all([
      fetchLinearViewer(tok, signal),
      fetchLinearIssues(tok, signal),
    ]);
    const filtered: LinearIssue[] = issues.filter((i) => {
      if (i.state.type === "completed" || i.state.type === "canceled") return false;
      if (
        typeof input.priority === "number" &&
        i.priority !== input.priority
      )
        return false;
      return true;
    });
    const top = filtered.slice(0, limit);
    return {
      summary: {
        organization: viewer.organization.name,
        assignee: viewer.name,
        issues: top.map((i) => ({
          identifier: i.identifier,
          title: i.title,
          state: i.state.name,
          priority: i.priority,
          ageHours: Math.round((Date.now() - new Date(i.updatedAt).getTime()) / 3_600_000),
        })),
      },
      citations: top.map((i) => ({
        toolId: "linear",
        type: "issue" as const,
        title: `${i.identifier} · ${i.title}`,
        subtitle: `${i.state.name} · priority ${i.priority}`,
        url: i.url,
        timestamp: new Date(i.updatedAt).getTime(),
      })),
    };
  },
};

const LIST_REVIEW_REQUESTS: ToolDefinition = {
  name: "list_review_requests",
  description:
    "List pull requests on GitHub that are waiting on the authenticated user's review. Use for 'PRs on my plate', 'what should I review?'.",
  input_schema: {
    type: "object",
    properties: {
      limit: { type: "number", description: "Max PRs to return (1-20, default 8)" },
    },
    required: [],
  },
  async run(input, ctx, signal) {
    const tok = requireToken(ctx, "github", "GitHub");
    const user = await fetchGitHubUser(tok, signal);
    const limit = clampLimit(input.limit, 8, 20);
    // Search API: PRs where user is a requested reviewer. Open only.
    const q = encodeURIComponent(
      `is:pr is:open review-requested:${user.login}`,
    );
    const res = await fetch(
      `https://api.github.com/search/issues?per_page=${limit}&q=${q}`,
      {
        headers: {
          Authorization: `Bearer ${tok}`,
          Accept: "application/vnd.github+json",
        },
        signal,
      },
    );
    if (!res.ok) {
      throw new Error(`GitHub: ${res.status} ${res.statusText}`);
    }
    const body = (await res.json()) as {
      items: { title: string; html_url: string; updated_at: string; repository_url: string }[];
    };
    const prs = body.items;
    return {
      summary: {
        reviewer: user.login,
        prs: prs.map((p) => ({
          title: p.title,
          repo: p.repository_url.replace(/^https?:\/\/api\.github\.com\/repos\//, ""),
          ageHours: Math.round((Date.now() - new Date(p.updated_at).getTime()) / 3_600_000),
        })),
      },
      citations: prs.map((p) => ({
        toolId: "github",
        type: "pr" as const,
        title: p.title,
        subtitle: p.repository_url.replace(/^https?:\/\/api\.github\.com\/repos\//, ""),
        url: p.html_url,
        timestamp: new Date(p.updated_at).getTime(),
      })),
    };
  },
};

const LIST_RECENT_REPOS: ToolDefinition = {
  name: "list_recent_repos",
  description:
    "List the user's most recently pushed GitHub repos. Useful for 'what have I been working on?', 'when did I last push to repo X?'.",
  input_schema: {
    type: "object",
    properties: {
      limit: { type: "number", description: "Max repos to return (1-20, default 6)" },
    },
    required: [],
  },
  async run(input, ctx, signal) {
    const tok = requireToken(ctx, "github", "GitHub");
    const repos = await fetchGitHubRepos(tok, signal);
    const limit = clampLimit(input.limit, 6, 20);
    const top = repos.slice(0, limit);
    return {
      summary: top.map((r) => ({
        name: r.full_name,
        description: r.description,
        language: r.language,
        stars: r.stargazers_count,
        pushedAt: r.pushed_at,
        private: r.private,
      })),
      citations: top.map((r) => ({
        toolId: "github",
        type: "repo" as const,
        title: r.full_name,
        subtitle: r.description ?? "—",
        url: r.html_url,
        timestamp: new Date(r.pushed_at).getTime(),
      })),
    };
  },
};

const LIST_MY_NOTES: ToolDefinition = {
  name: "list_my_notes",
  description:
    "List the user's contextual notes — short text snippets they've attached to tools or incidents in Hangar. Powerful for institutional memory: 'have I seen this before?', 'did I write down how to fix X?', 'what did I note about Vercel last month?'. Optional toolId filters to one tool's notes; optional query is a case-insensitive text match.",
  input_schema: {
    type: "object",
    properties: {
      toolId: {
        type: "string",
        description: "Filter to notes attached to this tool ID (e.g. 'vercel', 'sentry')",
      },
      query: {
        type: "string",
        description: "Case-insensitive substring match against note text",
      },
      limit: { type: "number", description: "Max notes to return (1-20, default 8)" },
    },
    required: [],
  },
  async run(input) {
    // Read directly from localStorage so the tool doesn't need to be plumbed
    // through the React tree. Workspace-scoped key, same as the useNotes hook.
    try {
      const active = localStorage.getItem("hangar-active-workspace") ?? "default";
      const raw = localStorage.getItem(`hangar-notes-${active}`);
      if (!raw) return { summary: { count: 0, notes: [] }, citations: [] };
      const all = JSON.parse(raw) as Array<{
        id: string;
        text: string;
        scope: { kind: string; toolId?: string; incidentId?: string };
        updatedAt: number;
        createdAt: number;
      }>;
      let filtered = all;
      if (typeof input.toolId === "string") {
        filtered = filtered.filter(
          (n) => n.scope?.kind === "tool" && n.scope.toolId === input.toolId,
        );
      }
      if (typeof input.query === "string" && input.query.trim().length > 0) {
        const q = input.query.toLowerCase();
        filtered = filtered.filter((n) => n.text.toLowerCase().includes(q));
      }
      filtered.sort((a, b) => b.updatedAt - a.updatedAt);
      const limit = clampLimit(input.limit, 8, 20);
      const top = filtered.slice(0, limit);
      return {
        summary: {
          totalMatching: filtered.length,
          notes: top.map((n) => ({
            text: n.text,
            scope: n.scope,
            updatedAtIso: new Date(n.updatedAt).toISOString(),
            ageDays: Math.round((Date.now() - n.updatedAt) / 86_400_000),
          })),
        },
        citations: [],
      };
    } catch {
      return {
        summary: { notes: [], note: "Couldn't read notes from local storage." },
        citations: [],
      };
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────
// Public registry
// ─────────────────────────────────────────────────────────────────────────

export const ASK_TOOLS: ToolDefinition[] = [
  READ_STACK,
  LIST_RECENT_DEPLOYS,
  LIST_UNRESOLVED_ISSUES,
  LIST_ASSIGNED_ISSUES,
  LIST_REVIEW_REQUESTS,
  LIST_RECENT_REPOS,
  LIST_MY_NOTES,
];

// Used by the system prompt: enumerate which integrations have tokens so
// Claude knows what's actually queryable in this session.
export function availableIntegrations(ctx: ToolContext): string[] {
  const out: string[] = ["read_stack (always)"];
  if (token(ctx, "vercel")) out.push("Vercel");
  if (token(ctx, "sentry")) out.push("Sentry");
  if (token(ctx, "linear")) out.push("Linear");
  if (token(ctx, "github")) out.push("GitHub");
  return out;
}
