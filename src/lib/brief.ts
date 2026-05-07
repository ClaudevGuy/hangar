// "Hangar Brief" — feeds the user's structured stack snapshot to Claude and
// returns a synthesized 4-6 sentence narrative. All in-browser; the user's
// Anthropic key (held in the vault, scoped to localStorage) never leaves
// their machine for any destination other than api.anthropic.com.

import type { GitHubUser } from "./github";
import type { LinearIssue, LinearViewer } from "./linear";
import type { SentryIssue, SentryOrganization } from "./sentry";
import type { VercelDeployment, VercelUser } from "./vercel";
import type { Tool } from "../types";

export interface BriefInput {
  generatedAt: string;
  stack: {
    pinnedCount: number;
    pinnedToolIds: string[];
    monthlyCostUsd: number;
    monthlyCostTrackedTools: number;
    monthlyCostUntrackedTools: number;
  };
  vercel?: {
    user?: string;
    deploys: BriefDeploy[];
    error?: string;
  };
  sentry?: {
    organization?: string;
    issues: BriefSentryIssue[];
    error?: string;
  };
  linear?: {
    organization?: string;
    urgentOpenIssues: BriefLinearIssue[];
    error?: string;
  };
  github?: {
    login?: string;
    error?: string;
  };
}

export interface BriefDeploy {
  name: string;
  state: string;
  target: string | null;
  branch: string | null;
  ageHours: number;
}

export interface BriefSentryIssue {
  title: string;
  project: string;
  level: string;
  eventCount: number;
  userCount: number;
  lastSeenHours: number;
}

export interface BriefLinearIssue {
  identifier: string;
  title: string;
  state: string;
  ageHours: number;
}

const SYSTEM_PROMPT = `You are a senior dev's morning briefing assistant. You read structured data about their dev tool stack and produce a short, actionable narrative.

Style rules — strict:
- 4 to 6 sentences total. Never more.
- Lead with the most important thing (deploy failures, error spikes, urgent tickets).
- Call out cross-tool correlations when the data suggests one (e.g., new Sentry errors right after a Vercel deploy).
- End with one clear recommended action, or a calm "all clear" sentence if nothing notable.
- Plain prose only. No bullets, no headers, no markdown beyond **bold** for tool names or critical claims.
- Tone: matter-of-fact, like a senior teammate at standup. No "as an AI" preamble, no apologies, no fluff.
- If a provider isn't mentioned in the snapshot, the user hasn't connected it — don't say "I can't see X". Just write around the gap.`;

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-5";

export async function generateBrief(input: BriefInput, anthropicKey: string, signal?: AbortSignal): Promise<string> {
  const body = {
    model: MODEL,
    max_tokens: 600,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Stack snapshot:\n\n${JSON.stringify(input, null, 2)}\n\nWrite the briefing now.`,
      },
    ],
  };

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    let detail = "";
    try {
      const errBody = (await res.json()) as { error?: { message?: string; type?: string } };
      const msg = errBody.error?.message ?? errBody.error?.type;
      if (msg) detail = ` — ${msg}`;
    } catch {
      // body wasn't JSON, ignore
    }
    throw new Error(`Anthropic: ${res.status} ${res.statusText}${detail}`);
  }

  const data = (await res.json()) as {
    content: { type: string; text: string }[];
  };
  const textBlock = data.content.find((c) => c.type === "text");
  if (!textBlock?.text) throw new Error("Anthropic: empty response");
  return textBlock.text.trim();
}

// ── Builders that turn the per-provider hook state into BriefInput ────────────

const HOUR_MS = 60 * 60 * 1000;

function ageHours(ms: number): number {
  return Math.round((Date.now() - ms) / HOUR_MS);
}

export interface BuildBriefArgs {
  stackTools: Tool[];
  monthlyCost: { total: number; tracked: number; untracked: number };
  vercel?: {
    token: boolean;
    user: VercelUser | null;
    deployments: VercelDeployment[];
    error: string | null;
  };
  sentry?: {
    token: boolean;
    org: SentryOrganization | null;
    issues: SentryIssue[];
    error: string | null;
  };
  linear?: {
    token: boolean;
    viewer: LinearViewer | null;
    issues: LinearIssue[];
    error: string | null;
  };
  github?: {
    token: boolean;
    user: GitHubUser | null;
    error: string | null;
  };
}

export function buildBriefInput(args: BuildBriefArgs): BriefInput {
  const input: BriefInput = {
    generatedAt: new Date().toISOString(),
    stack: {
      pinnedCount: args.stackTools.length,
      pinnedToolIds: args.stackTools.map((t) => t.id),
      monthlyCostUsd: Math.round(args.monthlyCost.total),
      monthlyCostTrackedTools: args.monthlyCost.tracked,
      monthlyCostUntrackedTools: args.monthlyCost.untracked,
    },
  };

  if (args.vercel?.token) {
    const recent = args.vercel.deployments
      .slice(0, 8)
      .map<BriefDeploy>((d) => ({
        name: d.name,
        state: d.state,
        target: d.target ?? null,
        branch: d.meta?.branch ?? null,
        ageHours: ageHours(d.created),
      }));
    input.vercel = {
      user: args.vercel.user?.username,
      deploys: recent,
      error: args.vercel.error ?? undefined,
    };
  }

  if (args.sentry?.token) {
    const issues = args.sentry.issues.slice(0, 8).map<BriefSentryIssue>((i) => ({
      title: i.title,
      project: i.project.slug,
      level: i.level,
      eventCount: Number(i.count),
      userCount: i.userCount,
      lastSeenHours: ageHours(new Date(i.lastSeen).getTime()),
    }));
    input.sentry = {
      organization: args.sentry.org?.name,
      issues,
      error: args.sentry.error ?? undefined,
    };
  }

  if (args.linear?.token) {
    const open = args.linear.issues
      .filter((i) => i.state.type !== "completed" && i.state.type !== "canceled")
      .filter((i) => i.priority === 1 || i.priority === 2)
      .slice(0, 6)
      .map<BriefLinearIssue>((i) => ({
        identifier: i.identifier,
        title: i.title,
        state: i.state.name,
        ageHours: ageHours(new Date(i.updatedAt).getTime()),
      }));
    input.linear = {
      organization: args.linear.viewer?.organization.name,
      urgentOpenIssues: open,
      error: args.linear.error ?? undefined,
    };
  }

  if (args.github?.token) {
    input.github = {
      login: args.github.user?.login,
      error: args.github.error ?? undefined,
    };
  }

  return input;
}
