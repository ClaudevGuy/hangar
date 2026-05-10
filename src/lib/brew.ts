// Morning Brew — single-shot Anthropic call that produces a one-paragraph
// briefing of the user's stack state. Browser-direct to the Messages API
// (same dangerous-direct-browser-access flag the Investigate / Ask flows use).
//
// Caller is responsible for caching. We just take the input and return text.

import type { Incident, IncidentSeverity } from "../hooks/useIncidents";
import type { PulseTrack } from "../hooks/useStackPulse";
import type { ToolMetaMap } from "../hooks/useToolMeta";
import type { Tool } from "../types";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-5";

export interface BrewInput {
  stackTools: Tool[];
  toolMeta: ToolMetaMap;
  incidents: Incident[];
  // Per-tool 24h activity tracks. Without this Claude only sees stack
  // composition + incidents + lastOpenedAt and ends up inventing
  // narratives like "GitHub hasn't been touched in four days" from the
  // last-clicked timestamp — which doesn't reflect actual repo activity.
  pulse: PulseTrack[];
}

const SYSTEM = `You are "Hangar Brew" — the morning briefing voice for a developer's tool dashboard.

You read the user's stack state and write a single short paragraph (2–4 sentences, 60–90 words) summarizing what's happening across their connected tools and what to focus on today.

Tone: a sharp, calm engineering colleague briefing the user over coffee. Specific, not generic. Reference exact tool names, counts, and identifiers from the input.

Style:
- One paragraph only. No lists, headers, or markdown beyond inline **bold**.
- Use **bold** sparingly for tool names (e.g. **Vercel**, **Sentry**) and identifiers (e.g. **HAN-87**).
- Lead with the most pressing issue if there is one; otherwise lead with momentum or a useful observation.
- Present tense, active voice.
- Don't open with "Today" or "Good morning". Open with the most important fact.
- If nothing's wrong, say so plainly — don't manufacture urgency.
- Don't mention this is AI-generated. Don't sign off.`;

export async function generateBrew(
  input: BrewInput,
  apiKey: string,
  signal?: AbortSignal,
): Promise<string> {
  const userPrompt = formatUserPrompt(input);
  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 400,
      system: SYSTEM,
      messages: [{ role: "user", content: userPrompt }],
    }),
    signal,
  });
  if (!res.ok) {
    let detail = "";
    try {
      const errBody = (await res.json()) as { error?: { message?: string } };
      if (errBody.error?.message) detail = ` — ${errBody.error.message}`;
    } catch {
      // body wasn't JSON
    }
    throw new Error(`Anthropic: ${res.status} ${res.statusText}${detail}`);
  }
  const body = (await res.json()) as {
    content: Array<{ type: string; text?: string }>;
  };
  return body.content
    .filter((b): b is { type: string; text: string } => b.type === "text" && typeof b.text === "string")
    .map((b) => b.text)
    .join("\n\n")
    .trim();
}

// Formats the structured stack snapshot into a compact textual prompt. We
// keep it short (each incident gets one line) so total input tokens stay
// under ~600 even with a busy stack.
function formatUserPrompt(input: BrewInput): string {
  const { stackTools, toolMeta, incidents, pulse } = input;
  const lines: string[] = [];

  // Build a quick lookup: toolId → 24h event count. Used both for the
  // stack listing (so each tool line carries its activity inline) and for
  // the dedicated "what was hot" callout below.
  const activityByTool = new Map<string, number>();
  for (const track of pulse) activityByTool.set(track.toolId, track.totalActivity);

  lines.push(`Stack (${stackTools.length} pinned):`);
  for (const t of stackTools) {
    const m = toolMeta[t.id];
    const plan = m?.plan ?? t.plan ?? "—";
    const ago = m?.lastOpenedAt ? formatAgo(m.lastOpenedAt) : null;
    const lastOpenTail = ago ? `, last opened by user ${ago}` : "";
    // 24h activity is the SOURCE OF TRUTH for "is this tool active". The
    // last-opened timestamp is just when the human clicked through to the
    // dashboard — Claude was confusing the two before this addition.
    const events = activityByTool.get(t.id) ?? 0;
    const activityTail = events === 0
      ? ", 24h activity: none"
      : `, 24h activity: ${events} ${events === 1 ? "event" : "events"}`;
    lines.push(`- ${t.name} (${t.category}, plan: ${plan}${activityTail}${lastOpenTail})`);
  }

  // Quick "what was hot" summary so Claude can lead with the busiest
  // tool when there are no incidents to lead with. Sorted desc by event
  // count; tools with zero activity aren't worth a callout.
  const ranked = [...pulse]
    .filter((p) => p.totalActivity > 0)
    .sort((a, b) => b.totalActivity - a.totalActivity);
  if (ranked.length > 0) {
    const top = ranked.slice(0, 3).map((p) => {
      const tool = stackTools.find((s) => s.id === p.toolId);
      const name = tool?.name ?? p.toolId;
      return `${name} (${p.totalActivity})`;
    });
    lines.push("");
    lines.push(`Most active in last 24h: ${top.join(", ")}.`);
  } else {
    lines.push("");
    lines.push(`No tool activity in the last 24h — every connected provider is quiet.`);
  }

  if (incidents.length === 0) {
    lines.push("");
    lines.push("Incidents: none. All connected providers are quiet.");
  } else {
    lines.push("");
    lines.push(`Incidents (${incidents.length} total):`);
    const grouped = groupBy(incidents, (i) => i.source);
    for (const [src, arr] of Object.entries(grouped)) {
      const counts = countSeverities(arr);
      lines.push(`- ${src}: ${arr.length} (${formatSeverityCounts(counts)})`);
      // Top 3 titles per source — enough for Claude to pick the standout.
      for (const inc of arr.slice(0, 3)) {
        const ago = formatAgo(inc.occurredAt);
        const ctx = inc.context ? ` — ${inc.context}` : "";
        lines.push(`  • [${inc.severity}] ${inc.title}${ctx} (${ago})`);
      }
    }
  }

  lines.push("");
  lines.push(`Now: ${new Date().toISOString()}.`);
  lines.push("Write the briefing.");
  return lines.join("\n");
}

function formatAgo(ms: number): string {
  const diff = Date.now() - ms;
  if (diff < 0) {
    // future date — token expiry sometimes provides "expires in 9 days"
    const h = Math.round(-diff / (60 * 60 * 1000));
    if (h < 24) return `in ${h}h`;
    return `in ${Math.round(h / 24)}d`;
  }
  const h = Math.round(diff / (60 * 60 * 1000));
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

function groupBy<T>(arr: T[], key: (x: T) => string): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const x of arr) {
    const k = key(x);
    if (!out[k]) out[k] = [];
    out[k].push(x);
  }
  return out;
}

function countSeverities(arr: Incident[]): Record<IncidentSeverity, number> {
  const out: Record<IncidentSeverity, number> = { critical: 0, warning: 0, info: 0 };
  for (const i of arr) out[i.severity]++;
  return out;
}

function formatSeverityCounts(c: Record<IncidentSeverity, number>): string {
  const parts: string[] = [];
  if (c.critical) parts.push(`${c.critical} critical`);
  if (c.warning) parts.push(`${c.warning} warning`);
  if (c.info) parts.push(`${c.info} info`);
  return parts.join(", ");
}
