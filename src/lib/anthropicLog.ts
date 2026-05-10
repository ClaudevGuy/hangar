// Rolling local log of every Anthropic API call Hangar makes — Brief,
// Morning Brew, Ask turns, Investigate. Persists per-workspace to
// localStorage with a 100-event cap. Powers Stack Pulse + Logs so
// Anthropic actually shows activity (it's the busiest tool by call
// volume on most setups, but it had no integration data feeding the
// dashboard until this log existed).
//
// Each Anthropic call site (`lib/brief.ts`, `lib/brew.ts`, `lib/ask.ts`,
// `lib/investigate.ts`) calls `recordAnthropicCall` after a successful
// response. The hook (`hooks/useAnthropicLog`) subscribes to the
// CHANGE_EVENT so the dashboard re-renders the moment a new event lands.

import { workspaceKey } from "./workspaces";

export type AnthropicCallKind = "brief" | "brew" | "ask" | "investigate";

export interface AnthropicEvent {
  id: string;
  kind: AnthropicCallKind;
  // ms since epoch — single field used for both display and bucketing.
  timestamp: number;
  // Usage from the Anthropic response, when the caller knows it. All
  // four current callers do — they need the same numbers for cost meters.
  inputTokens?: number;
  outputTokens?: number;
  // Optional one-line context label for the Logs feed: the user query
  // for an Ask turn, the incident title for an Investigate, etc.
  label?: string;
}

const MAX_EVENTS = 100;
export const ANTHROPIC_LOG_CHANGE = "hangar-anthropic-log-changed";

const storageKey = () => workspaceKey("hangar-anthropic-log");

function newId(): string {
  return `ant_${Math.random().toString(36).slice(2, 10)}`;
}

function isEvent(v: unknown): v is AnthropicEvent {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.timestamp === "number" &&
    typeof o.kind === "string"
  );
}

function read(): AnthropicEvent[] {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isEvent);
  } catch {
    return [];
  }
}

function write(events: AnthropicEvent[]): void {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(events));
    // Notify same-tab subscribers via custom event. Cross-tab updates
    // ride the native StorageEvent which the hook also listens for.
    window.dispatchEvent(new CustomEvent(ANTHROPIC_LOG_CHANGE));
  } catch {
    // Quota / serialization — silent. Worst case the event doesn't
    // persist, which is fine for an analytics log.
  }
}

export function recordAnthropicCall(
  input: Omit<AnthropicEvent, "id" | "timestamp">,
): void {
  const event: AnthropicEvent = {
    id: newId(),
    timestamp: Date.now(),
    ...input,
  };
  // Newest first; trim to cap so the log can't grow without bound.
  const next = [event, ...read()].slice(0, MAX_EVENTS);
  write(next);
}

export function readAnthropicEvents(): AnthropicEvent[] {
  return read();
}

// Test/debug helper — wired into the keys "Reset workspace" flow if we
// ever build it. Not used in production code paths today.
export function clearAnthropicEvents(): void {
  write([]);
}
