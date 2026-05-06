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
