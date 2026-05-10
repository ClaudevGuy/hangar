// AI Action — per-incident investigation. Same browser-direct pattern as
// the Brief: pulls data from the user's existing data hooks, builds a focused
// snapshot for one incident, asks Claude to diagnose and suggest concrete
// next actions. Tokens never leave the browser for any destination other
// than api.anthropic.com.

import { recordAnthropicCall } from "./anthropicLog";
import type { Incident, IncidentRaw } from "../hooks/useIncidents";
import type { SentryIssue } from "./sentry";
import type { VercelDeployment } from "./vercel";

export type ActionPayload =
  | { type: "open_url"; url: string }
  | { type: "copy"; text: string };

export interface Suggestion {
  label: string;
  action: ActionPayload;
}

export interface Investigation {
  diagnosis: string;
  suggestions: Suggestion[];
}

interface InvestigateInput {
  incident: {
    source: string;
    severity: string;
    title: string;
    context?: string;
    url?: string;
    ageHours: number;
    raw?: { kind: string; data: unknown };
  };
  stackToolIds: string[];
  recentDeploys?: {
    name: string;
    state: string;
    target?: string | null;
    branch?: string | null;
    ageHours: number;
  }[];
  recentSentryIssues?: {
    title: string;
    project: string;
    level: string;
    eventCount: number;
    lastSeenHours: number;
  }[];
}

const SYSTEM_PROMPT = `You are a senior dev's incident investigator. The user has clicked into ONE specific incident in their Hangar dashboard. Read the incident data plus their stack context, look for cross-tool correlations, and return a focused JSON diagnosis.

Output format — strict JSON only, no other text:

{"diagnosis":"...","suggestions":[{"label":"...","action":{"type":"open_url","url":"..."}},{"label":"...","action":{"type":"copy","text":"..."}}]}

Field rules:
- diagnosis: 2-3 sentences. Lead with what's likely happening and why. If the recent deploy/issue arrays show a correlation (e.g., a Sentry error first appearing right after a Vercel deploy), name it explicitly. Use **bold** for tool names. No fluff.
- suggestions: 1 to 3 items. Each must be specifically actionable, not generic.
- action.type "open_url" must use a real URL from the data — Sentry permalink, Vercel deploy URL, Linear ticket URL, GitHub commit/PR URL. Don't invent URLs.
- action.type "copy" is for drafted text the user can paste — Linear ticket title+body, Slack message, commit message, etc. Make it complete and ready to paste, including a "Title: ..." line for tickets when relevant. Use \\n for line breaks inside the JSON string.
- No "investigate further" or "check the logs" suggestions without a URL. Be concrete.
- No preamble, no explanation, no markdown fences, no markdown beyond **bold** in diagnosis.

Example for a Sentry incident on a recently-deployed branch:
{"diagnosis":"**Vercel** v2.4.1 deployed to production 18 minutes before this **Sentry** error first appeared, and the stack trace points to changed code in pages/checkout.tsx. Likely a regression — 12 users have hit the same TypeError since the deploy.","suggestions":[{"label":"Open the Sentry issue","action":{"type":"open_url","url":"https://sentry.io/organizations/example/issues/1234/"}},{"label":"Copy Linear ticket draft","action":{"type":"copy","text":"Title: Fix TypeError in checkout after v2.4.1\\n\\nSentry issue is firing for 12 users on pages/checkout.tsx. First seen 18m after Vercel deploy v2.4.1. Likely regression from that ship. Stack trace and link in Sentry."}}]}`;

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-5";

export async function generateInvestigation(
  input: InvestigateInput,
  anthropicKey: string,
  signal?: AbortSignal,
): Promise<string> {
  const body = {
    model: MODEL,
    max_tokens: 800,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Incident snapshot:\n\n${JSON.stringify(input, null, 2)}\n\nWrite the investigation now.`,
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
      // ignore
    }
    throw new Error(`Anthropic: ${res.status} ${res.statusText}${detail}`);
  }

  const data = (await res.json()) as {
    content: { type: string; text: string }[];
    usage?: { input_tokens?: number; output_tokens?: number };
  };
  const textBlock = data.content.find((c) => c.type === "text");
  if (!textBlock?.text) throw new Error("Anthropic: empty response");
  // Log the call so the Logs feed reflects each per-incident investigation.
  recordAnthropicCall({
    kind: "investigate",
    inputTokens: data.usage?.input_tokens,
    outputTokens: data.usage?.output_tokens,
    label: input.incident.title,
  });
  return textBlock.text.trim();
}

function isActionPayload(v: unknown): v is ActionPayload {
  if (!v || typeof v !== "object") return false;
  const obj = v as Record<string, unknown>;
  if (obj.type === "open_url" && typeof obj.url === "string") return true;
  if (obj.type === "copy" && typeof obj.text === "string") return true;
  return false;
}

export function parseInvestigation(text: string): Investigation | null {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const obj = parsed as Record<string, unknown>;
  if (typeof obj.diagnosis !== "string") return null;
  if (!Array.isArray(obj.suggestions)) return null;
  const suggestions: Suggestion[] = [];
  for (const s of obj.suggestions) {
    if (!s || typeof s !== "object") continue;
    const sObj = s as Record<string, unknown>;
    if (typeof sObj.label !== "string") continue;
    if (!isActionPayload(sObj.action)) continue;
    suggestions.push({ label: sObj.label, action: sObj.action });
  }
  return {
    diagnosis: obj.diagnosis,
    suggestions,
  };
}

const HOUR_MS = 60 * 60 * 1000;
function ageHours(ms: number): number {
  return Math.round((Date.now() - ms) / HOUR_MS);
}

export interface BuildInvestigateArgs {
  incident: Incident & { raw?: IncidentRaw };
  stackToolIds: string[];
  recentDeploys?: VercelDeployment[];
  recentSentryIssues?: SentryIssue[];
}

export function buildInvestigateInput(args: BuildInvestigateArgs): InvestigateInput {
  const inc = args.incident;
  const input: InvestigateInput = {
    incident: {
      source: inc.source,
      severity: inc.severity,
      title: inc.title,
      context: inc.context,
      url: inc.url,
      ageHours: ageHours(inc.occurredAt),
      raw: inc.raw ? { kind: inc.raw.kind, data: inc.raw.data } : undefined,
    },
    stackToolIds: args.stackToolIds,
  };
  if (args.recentDeploys && args.recentDeploys.length > 0) {
    input.recentDeploys = args.recentDeploys.slice(0, 5).map((d) => ({
      name: d.name,
      state: d.state,
      target: d.target ?? null,
      branch: d.meta?.branch ?? null,
      ageHours: ageHours(d.created),
    }));
  }
  if (args.recentSentryIssues && args.recentSentryIssues.length > 0) {
    input.recentSentryIssues = args.recentSentryIssues.slice(0, 5).map((i) => ({
      title: i.title,
      project: i.project.slug,
      level: i.level,
      eventCount: Number(i.count),
      lastSeenHours: ageHours(new Date(i.lastSeen).getTime()),
    }));
  }
  return input;
}
