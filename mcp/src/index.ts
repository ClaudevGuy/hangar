#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const VERSION = "0.1.0";

interface StackTool {
  id: string;
  name: string;
  category?: string;
  plan?: string;
  lastOpenedAt?: number;
}

interface StackConfig {
  tools: StackTool[];
}

const DEFAULT_CONFIG_PATH = join(homedir(), ".hangar", "mcp.json");

async function readStackConfig(): Promise<StackConfig> {
  const path = process.env.HANGAR_MCP_CONFIG ?? DEFAULT_CONFIG_PATH;
  try {
    const text = await readFile(path, "utf-8");
    const parsed = JSON.parse(text) as Partial<StackConfig>;
    return { tools: Array.isArray(parsed.tools) ? parsed.tools : [] };
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === "ENOENT") {
      // Config file missing — return empty rather than failing the whole server.
      // The AI can still answer "you don't have a stack configured".
      return { tools: [] };
    }
    throw new Error(`Couldn't read Hangar config at ${path}: ${e.message}`);
  }
}

interface SentryOrgRaw {
  slug: string;
  name: string;
}

interface SentryIssueRaw {
  shortId: string;
  title: string;
  culprit?: string;
  level: string;
  count: string;
  userCount: number;
  permalink: string;
  firstSeen: string;
  lastSeen: string;
  project: { slug: string };
}

async function listUnresolvedIssues(): Promise<unknown> {
  const token = process.env.SENTRY_TOKEN;
  if (!token) {
    throw new Error(
      "SENTRY_TOKEN env var not set. Create one at https://sentry.io/settings/account/api/auth-tokens/ with org:read, project:read, event:read scopes.",
    );
  }
  const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };

  const orgsRes = await fetch("https://sentry.io/api/0/organizations/", { headers });
  if (!orgsRes.ok) {
    throw new Error(`Sentry orgs: ${orgsRes.status} ${orgsRes.statusText}`);
  }
  const orgs = (await orgsRes.json()) as SentryOrgRaw[];
  if (orgs.length === 0) {
    return { issues: [], note: "No Sentry organizations on this token." };
  }
  const org = orgs[0]!;

  const issuesUrl = `https://sentry.io/api/0/organizations/${encodeURIComponent(org.slug)}/issues/?statsPeriod=14d&limit=10&query=${encodeURIComponent("is:unresolved")}`;
  const issuesRes = await fetch(issuesUrl, { headers });
  if (!issuesRes.ok) {
    throw new Error(`Sentry issues: ${issuesRes.status} ${issuesRes.statusText}`);
  }
  const issues = (await issuesRes.json()) as SentryIssueRaw[];

  return {
    organization: { name: org.name, slug: org.slug },
    issues: issues.map((issue) => ({
      shortId: issue.shortId,
      title: issue.title,
      level: issue.level,
      project: issue.project.slug,
      eventCount: Number(issue.count),
      userCount: issue.userCount,
      firstSeen: issue.firstSeen,
      lastSeen: issue.lastSeen,
      url: issue.permalink,
    })),
  };
}

interface VercelDeployRaw {
  uid: string;
  name: string;
  url: string;
  state: string;
  created: number;
  target?: string | null;
  meta?: { branch?: string; githubCommitMessage?: string };
}

interface ListDeploysArgs {
  limit?: number;
  onlyFailed?: boolean;
}

interface LinearIssueRaw {
  id: string;
  identifier: string;
  title: string;
  url: string;
  priority: number;
  updatedAt: string;
  state: { name: string; type: string };
  team: { key: string };
}

interface LinearGqlResponse {
  data?: {
    viewer: {
      name: string;
      email: string;
      organization: { name: string; urlKey: string };
      assignedIssues: { nodes: LinearIssueRaw[] };
    };
  };
  errors?: { message: string }[];
}

async function listAssignedIssues(): Promise<unknown> {
  const token = process.env.LINEAR_TOKEN;
  if (!token) {
    throw new Error(
      "LINEAR_TOKEN env var not set. Create a personal API key at https://linear.app/settings/api.",
    );
  }
  const query = `
    query MyIssues {
      viewer {
        name email
        organization { name urlKey }
        assignedIssues(first: 15, orderBy: updatedAt) {
          nodes {
            id identifier title url priority updatedAt
            state { name type }
            team { key }
          }
        }
      }
    }
  `;
  const res = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    throw new Error(`Linear: ${res.status} ${res.statusText}`);
  }
  const body = (await res.json()) as LinearGqlResponse;
  if (body.errors && body.errors.length > 0) {
    throw new Error(`Linear: ${body.errors[0]!.message}`);
  }
  if (!body.data) throw new Error("Linear: empty response");
  const v = body.data.viewer;
  const open = v.assignedIssues.nodes.filter(
    (i) => i.state.type !== "completed" && i.state.type !== "canceled",
  );
  const PRIORITY_LABELS: Record<number, string> = {
    0: "none",
    1: "urgent",
    2: "high",
    3: "medium",
    4: "low",
  };
  return {
    viewer: {
      name: v.name,
      email: v.email,
      organization: v.organization.name,
    },
    issues: open.map((i) => ({
      identifier: i.identifier,
      title: i.title,
      team: i.team.key,
      state: i.state.name,
      priority: PRIORITY_LABELS[i.priority] ?? "unknown",
      updatedAt: i.updatedAt,
      url: i.url,
    })),
  };
}

interface GithubSearchItem {
  number: number;
  title: string;
  html_url: string;
  repository_url: string;
  user: { login: string } | null;
  created_at: string;
  updated_at: string;
  state: string;
  draft?: boolean;
}

async function listReviewRequests(): Promise<unknown> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error(
      "GITHUB_TOKEN env var not set. Create a PAT at https://github.com/settings/tokens with at least repo:status / public_repo (or full repo for private orgs).",
    );
  }
  // GitHub Search API: PRs that are open AND have a review requested from me.
  const url =
    "https://api.github.com/search/issues?q=" +
    encodeURIComponent("is:pr is:open review-requested:@me") +
    "&per_page=10&sort=updated";
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!res.ok) {
    throw new Error(`GitHub: ${res.status} ${res.statusText}`);
  }
  const body = (await res.json()) as { total_count: number; items: GithubSearchItem[] };
  return {
    totalCount: body.total_count,
    pullRequests: body.items.map((item) => ({
      number: item.number,
      title: item.title,
      repository: item.repository_url.replace("https://api.github.com/repos/", ""),
      author: item.user?.login ?? null,
      draft: item.draft ?? false,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      url: item.html_url,
    })),
  };
}

interface StripeCharge {
  amount: number;
  currency: string;
  status: string;
  created: number;
}

interface GetRevenueArgs {
  days?: number;
}

async function getRecentRevenue(args: GetRevenueArgs): Promise<unknown> {
  const token = process.env.STRIPE_TOKEN;
  if (!token) {
    throw new Error(
      "STRIPE_TOKEN env var not set. Use a restricted key with read access to Charges (https://dashboard.stripe.com/apikeys).",
    );
  }
  const days = Math.min(Math.max(args.days ?? 30, 1), 365);
  const since = Math.floor((Date.now() - days * 24 * 60 * 60 * 1000) / 1000);
  const url = `https://api.stripe.com/v1/charges?limit=100&created[gte]=${since}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Stripe: ${res.status} ${res.statusText}`);
  }
  const body = (await res.json()) as { data: StripeCharge[]; has_more: boolean };

  const byCurrency = new Map<string, { amount: number; count: number }>();
  for (const ch of body.data) {
    if (ch.status !== "succeeded") continue;
    const cur = ch.currency.toUpperCase();
    const entry = byCurrency.get(cur) ?? { amount: 0, count: 0 };
    entry.amount += ch.amount;
    entry.count += 1;
    byCurrency.set(cur, entry);
  }

  return {
    windowDays: days,
    succeededCharges: Array.from(byCurrency.values()).reduce((s, v) => s + v.count, 0),
    truncated: body.has_more,
    revenueByCurrency: Array.from(byCurrency.entries()).map(([currency, v]) => ({
      currency,
      // Stripe amounts are in the smallest currency unit (cents for USD).
      amount: v.amount / 100,
      chargeCount: v.count,
    })),
  };
}

async function listRecentDeploys(args: ListDeploysArgs): Promise<unknown> {
  const token = process.env.VERCEL_TOKEN;
  if (!token) {
    throw new Error(
      "VERCEL_TOKEN env var not set. Create one at https://vercel.com/account/tokens.",
    );
  }
  const limit = Math.min(Math.max(args.limit ?? 10, 1), 100);
  const url = `https://api.vercel.com/v6/deployments?limit=${limit}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    throw new Error(`Vercel: ${res.status} ${res.statusText}`);
  }
  const body = (await res.json()) as { deployments: VercelDeployRaw[] };

  let deploys = body.deployments.map((d) => ({
    uid: d.uid,
    name: d.name,
    url: d.url,
    state: d.state,
    target: d.target ?? null,
    branch: d.meta?.branch ?? null,
    commitMessage: d.meta?.githubCommitMessage ?? null,
    createdAt: new Date(d.created).toISOString(),
  }));
  if (args.onlyFailed) {
    deploys = deploys.filter((d) => d.state === "ERROR" || d.state === "CANCELED");
  }
  return { deployments: deploys };
}

const server = new Server(
  { name: "hangar-mcp", version: VERSION },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "read_stack",
      description:
        "Read the user's Hangar stack: pinned tools, plans, categories, last-opened timestamps. Source: ~/.hangar/mcp.json (override with HANGAR_MCP_CONFIG env var). Returns an empty stack if the config file doesn't exist. Use this whenever you need to know which dev tools the user uses.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "list_unresolved_issues",
      description:
        "List the user's currently-unresolved Sentry issues from the last 14 days. Requires SENTRY_TOKEN env var. Returns the top 10 issues with shortId, title, level, project, event/user counts, first/last seen timestamps, and a permalink. Use this to answer questions about errors, exceptions, or what's broken in production.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "list_recent_deploys",
      description:
        "List recent Vercel deployments. Requires VERCEL_TOKEN env var. Use 'limit' to cap the number returned (1–100, default 10) and 'onlyFailed' to filter to ERROR/CANCELED states. Returns deploy state, target (production/preview), branch, commit message, URL, and creation time. Use this to answer questions about deploy status or recent shipping activity.",
      inputSchema: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Max deployments to return (1–100, default 10)",
          },
          onlyFailed: {
            type: "boolean",
            description: "If true, return only deploys with state ERROR or CANCELED.",
          },
        },
      },
    },
    {
      name: "list_assigned_issues",
      description:
        "List the user's open Linear issues assigned to them, ordered by recently updated. Filters out completed and canceled states. Requires LINEAR_TOKEN env var. Returns identifier, title, team, state, priority (urgent/high/medium/low), updatedAt, and URL. Use this to answer questions about the user's task queue.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "list_review_requests",
      description:
        "List open GitHub PRs awaiting the user's review. Requires GITHUB_TOKEN env var (PAT with repo:status / public_repo or full repo scope). Returns PR number, title, repository (owner/name), author login, draft state, timestamps, and URL. Use this to answer questions about review backlog.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "get_recent_revenue",
      description:
        "Sum the user's succeeded Stripe charges in a recent time window, grouped by currency. Requires STRIPE_TOKEN env var (restricted key with read access to Charges is sufficient). Use 'days' (1–365, default 30) to set the window. Returns total charge count, per-currency totals (in major units, e.g. dollars), and a 'truncated' flag if more than 100 charges fell in the window.",
      inputSchema: {
        type: "object",
        properties: {
          days: {
            type: "number",
            description: "Look-back window in days (1–365, default 30).",
          },
        },
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  try {
    let result: unknown;
    switch (name) {
      case "read_stack":
        result = await readStackConfig();
        break;
      case "list_unresolved_issues":
        result = await listUnresolvedIssues();
        break;
      case "list_recent_deploys":
        result = await listRecentDeploys((args ?? {}) as ListDeploysArgs);
        break;
      case "list_assigned_issues":
        result = await listAssignedIssues();
        break;
      case "list_review_requests":
        result = await listReviewRequests();
        break;
      case "get_recent_revenue":
        result = await getRecentRevenue((args ?? {}) as GetRevenueArgs);
        break;
      default:
        return {
          isError: true,
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
        };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (err) {
    return {
      isError: true,
      content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
