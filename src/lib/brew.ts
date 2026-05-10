// Morning Brew — single-shot Anthropic call that produces a structured
// briefing of the user's stack state, mirroring the topbar Brief shape:
// status pill + headline + 2-4 observation bullets + recommended action.
// Browser-direct to the Messages API (same dangerous-direct-browser-access
// flag the Investigate / Ask flows use).
//
// Caller is responsible for caching. We take the input and return the
// parsed structured object PLUS the raw text (so we can fall back to
// rendering as prose if Claude returns malformed JSON one day).

import { recordAnthropicCall } from "./anthropicLog";
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

// Same status enum the Brief popover uses — keeps the visual language
// (green/yellow/red status pills) consistent across both surfaces.
export type BrewStatus = "green" | "yellow" | "red";

export interface BrewStructured {
  status: BrewStatus;
  headline: string;
  observations: string[];
  recommendation: string;
}

export interface BrewResult {
  // Parsed structured object when Claude returned valid JSON. The UI
  // prefers this and renders the rich layout (status pill / observations
  // / recommendation). Null when JSON parsing failed.
  structured: BrewStructured | null;
  // Raw text from Claude — kept for two reasons: (a) fallback display
  // when structured is null, (b) backward-compat with prior cached brews
  // that were stored as plain strings.
  raw: string;
}

const SYSTEM = `You are "Hangar Brew" — the morning briefing voice for a developer's tool dashboard.

You read the user's stack state and output strict JSON in exactly this shape — no other text:

{"status":"green"|"yellow"|"red","headline":"...","observations":["...","..."],"recommendation":"..."}

Field rules:
- status: green = all clear; yellow = something noteworthy to watch; red = active failure or urgent issue
- headline: ONE sentence, 12-22 words. Lead with the most important fact. Use **bold** for tool names. This is the executive read.
- observations: 2 to 4 items. Each one is a single specific data point from the snapshot, ~10-25 words. Use **bold** for tool names and identifiers. No padding, no filler.
- recommendation: ONE sentence with a concrete next action. Use "No action needed." when status is green and nothing's noteworthy.
- Don't mention providers absent from the snapshot — write around gaps, never say "I can't see X."
- Don't open the headline with "Today" or "Good morning". Open with the most important fact.
- CRITICAL: the snapshot only shows what the user's connected providers are doing — it does NOT show how often the user is actually checking their dashboards. Many devs hit github.com / vercel.com directly in the browser. Never infer user disengagement, neglect, "drift", or "haven't checked in N days" from the data; you have no way to know that. Talk about what the TOOLS are doing, not the user's habits.
- No preamble, no markdown fences, no trailing text. JSON object only.

Example:
{"status":"yellow","headline":"**GitHub** is the busy one today with 18 events while everything else is quiet.","observations":["**GitHub** logged 18 push/PR events in the last 24h — biggest signal in the stack","**Vercel** shipped 5 production deploys yesterday, all READY","**Anthropic**, **Inngest**, **Neon** are quiet — no AI calls, no jobs queued, no DB load"],"recommendation":"No action needed — green across the board."}`;

// Mirrors parseBriefStructured in lib/brief.ts. Strips optional ```json
// code fences (Claude sometimes emits them despite the prompt) before
// parsing. Returns null when the response isn't valid JSON OR doesn't
// match the expected shape — caller falls back to rendering raw text.
export function parseBrewStructured(text: string): BrewStructured | null {
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
  const headline = obj.headline;
  const observations = obj.observations;
  const recommendation = obj.recommendation;
  const status = obj.status;
  if (
    typeof headline !== "string" ||
    !Array.isArray(observations) ||
    !observations.every((o): o is string => typeof o === "string") ||
    typeof recommendation !== "string"
  ) {
    return null;
  }
  const validStatus: BrewStatus =
    status === "green" || status === "yellow" || status === "red" ? status : "yellow";
  return {
    status: validStatus,
    headline,
    observations,
    recommendation,
  };
}

export async function generateBrew(
  input: BrewInput,
  apiKey: string,
  signal?: AbortSignal,
): Promise<BrewResult> {
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
    usage?: { input_tokens?: number; output_tokens?: number };
  };
  // Record the call so Stack Pulse + Logs reflect it. Brews are once-a-
  // day-ish so this barely contributes to the Pulse, but the Logs feed
  // benefits from a row per refresh.
  recordAnthropicCall({
    kind: "brew",
    inputTokens: body.usage?.input_tokens,
    outputTokens: body.usage?.output_tokens,
    label: `Morning Brew · ${input.stackTools.length} pinned tools`,
  });
  const raw = body.content
    .filter((b): b is { type: string; text: string } => b.type === "text" && typeof b.text === "string")
    .map((b) => b.text)
    .join("\n\n")
    .trim();
  return { structured: parseBrewStructured(raw), raw };
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
    // 24h activity is the SOURCE OF TRUTH for "is this tool active".
    // We deliberately do NOT pass lastOpenedAt anymore — that's only
    // updated when the user clicks Open INSIDE Hangar, which misses
    // people who hit the provider's URL directly in their browser.
    // Claude was reading "last opened 4d ago" and inventing narratives
    // about user disengagement even when the Pulse showed dozens of
    // events of real provider activity. Drop the misleading signal;
    // let the activity numbers speak.
    const events = activityByTool.get(t.id) ?? 0;
    const activityTail = events === 0
      ? ", 24h activity: none"
      : `, 24h activity: ${events} ${events === 1 ? "event" : "events"}`;
    lines.push(`- ${t.name} (${t.category}, plan: ${plan}${activityTail})`);
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
