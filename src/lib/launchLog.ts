// Universal tool-launch log. Every time the user clicks "Open" on a
// tool — from a card, a row, the drawer, the sidebar list, or a
// keyboard chord — the launch is recorded here as a timestamped event.
//
// Why this exists: Stack Pulse + Logs were native-API-data-only, which
// meant tools without an integration (Inngest, Neon, Resend, Stripe…)
// always rendered "QUIET" even when the user opened them ten times a
// day. Launches are a real engagement signal we already capture (it's
// what powers `lastOpenedAt` and the frecency rank), so surfacing them
// as first-class events makes every connected tool light up the moment
// the user starts engaging with it. No per-provider integration code
// required.
//
// Mirrors the anthropicLog shape for consistency: rolling localStorage
// log capped at 200 events, custom-event-based subscription, workspace-
// scoped via `workspaceKey`. The hook (useLaunchLog) feeds into
// useIncidents → Stack Pulse + Logs.

import { workspaceKey } from "./workspaces";

export interface LaunchEvent {
  id: string;
  toolId: string;
  // ms since epoch — single field used for both Pulse bucketing + Logs sort.
  timestamp: number;
}

const MAX_EVENTS = 200;
export const LAUNCH_LOG_CHANGE = "hangar-launch-log-changed";

const storageKey = () => workspaceKey("hangar-launch-log");

function newId(): string {
  return `lc_${Math.random().toString(36).slice(2, 10)}`;
}

function isEvent(v: unknown): v is LaunchEvent {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return typeof o.id === "string" && typeof o.toolId === "string" && typeof o.timestamp === "number";
}

function read(): LaunchEvent[] {
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

function write(events: LaunchEvent[]): void {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(events));
    window.dispatchEvent(new CustomEvent(LAUNCH_LOG_CHANGE));
  } catch {
    // Quota / serialization — silent. Worst case a launch doesn't show
    // up in the Pulse, which is fine for an analytics signal.
  }
}

export function recordToolLaunch(toolId: string): void {
  const event: LaunchEvent = { id: newId(), toolId, timestamp: Date.now() };
  // Newest first; trim to cap so the log can't grow without bound.
  const next = [event, ...read()].slice(0, MAX_EVENTS);
  write(next);
}

export function readLaunchEvents(): LaunchEvent[] {
  return read();
}
