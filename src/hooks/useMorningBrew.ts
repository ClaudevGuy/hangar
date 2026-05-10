// Morning Brew state — caches a generated briefing per (workspace, day).
//
// Deliberately does NOT auto-fetch on mount. The first brew is always opt-in
// (the user clicks "Brew now") so we never silently spend their Anthropic
// budget. Once generated, today's brew lives in localStorage until the day
// rolls over; manual "Refresh" overwrites the cache.
//
// State carries BOTH a structured object (status / headline / observations
// / recommendation — same shape as the topbar Brief) AND the raw text. The
// component prefers structured when present; raw is the fallback for
// pre-structured caches and the rare malformed-JSON response.

import { useCallback, useEffect, useState } from "react";
import { generateBrew, type BrewStructured } from "../lib/brew";
import { workspaceKey } from "../lib/workspaces";
import type { Incident } from "./useIncidents";
import type { PulseTrack } from "./useStackPulse";
import type { ToolMetaMap } from "./useToolMeta";
import type { Tool } from "../types";

export type BrewStatus = "idle" | "loading" | "ready" | "error";

export interface BrewState {
  status: BrewStatus;
  // Raw text from Claude — present for back-compat with pre-structured
  // caches and as the fallback when structured parsing fails.
  text: string | null;
  // Parsed structured object — when present, the panel renders the rich
  // status/headline/observations/recommendation layout. When null,
  // falls back to rendering `text` as a single headline paragraph.
  structured: BrewStructured | null;
  generatedAt: number | null;
  // True when the cached text was generated on a previous calendar day —
  // the panel uses this to nudge "refresh for today's briefing".
  isStale: boolean;
  error: string | null;
}

interface CachedBrew {
  text: string;
  // Optional — older caches (pre this commit) only have text, so the
  // hook tolerates its absence and falls back to plain rendering.
  structured?: BrewStructured | null;
  generatedAt: number;
  // YYYY-MM-DD in the user's local timezone — invalidates daily.
  dayKey: string;
}

const storageKey = () => workspaceKey("hangar-brew");

function dayKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function readCache(): CachedBrew | null {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CachedBrew>;
    if (
      typeof parsed.text !== "string" ||
      typeof parsed.generatedAt !== "number" ||
      typeof parsed.dayKey !== "string"
    ) {
      return null;
    }
    return parsed as CachedBrew;
  } catch {
    return null;
  }
}

function writeCache(b: CachedBrew): void {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(b));
  } catch {
    // quota / serialization — swallow, brew will just live in memory.
  }
}

function buildInitialState(): BrewState {
  const cached = readCache();
  if (!cached) {
    return {
      status: "idle",
      text: null,
      structured: null,
      generatedAt: null,
      isStale: false,
      error: null,
    };
  }
  const today = dayKey();
  return {
    status: "ready",
    text: cached.text,
    structured: cached.structured ?? null,
    generatedAt: cached.generatedAt,
    isStale: cached.dayKey !== today,
    error: null,
  };
}

export interface UseMorningBrewArgs {
  apiKey: string | null;
  stackTools: Tool[];
  toolMeta: ToolMetaMap;
  incidents: Incident[];
  // Per-tool 24h activity tracks. Forwarded straight to the prompt so
  // Claude has real per-tool event counts to anchor its narrative on
  // (without this it ends up making up activity stories from
  // lastOpenedAt — see brew.ts comment for the full rationale).
  pulse: PulseTrack[];
}

export interface UseMorningBrewReturn extends BrewState {
  refresh: (signal?: AbortSignal) => Promise<void>;
}

export function useMorningBrew({
  apiKey,
  stackTools,
  toolMeta,
  incidents,
  pulse,
}: UseMorningBrewArgs): UseMorningBrewReturn {
  const [state, setState] = useState<BrewState>(buildInitialState);

  const refresh = useCallback(
    async (signal?: AbortSignal) => {
      if (!apiKey) {
        setState({
          status: "error",
          text: null,
          structured: null,
          generatedAt: null,
          isStale: false,
          error: "Add an Anthropic key to brew today's briefing.",
        });
        return;
      }
      setState((prev) => ({ ...prev, status: "loading", error: null }));
      try {
        const result = await generateBrew(
          { stackTools, toolMeta, incidents, pulse },
          apiKey,
          signal,
        );
        const generatedAt = Date.now();
        const dk = dayKey();
        writeCache({
          text: result.raw,
          structured: result.structured,
          generatedAt,
          dayKey: dk,
        });
        setState({
          status: "ready",
          text: result.raw,
          structured: result.structured,
          generatedAt,
          isStale: false,
          error: null,
        });
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        const message = err instanceof Error ? err.message : "Unknown error";
        setState((prev) => ({
          ...prev,
          status: "error",
          error: message,
        }));
      }
    },
    [apiKey, stackTools, toolMeta, incidents, pulse],
  );

  // Re-evaluate isStale when the day rolls over while the tab is open.
  // Cheap interval — every 5 minutes the panel checks if the cached brew
  // is from yesterday and surfaces the "stale" hint.
  useEffect(() => {
    const tick = () => {
      setState((prev) => {
        if (prev.status !== "ready") return prev;
        const cached = readCache();
        if (!cached) return prev;
        const stale = cached.dayKey !== dayKey();
        if (stale === prev.isStale) return prev;
        return { ...prev, isStale: stale };
      });
    };
    const id = window.setInterval(tick, 5 * 60 * 1000);
    return () => window.clearInterval(id);
  }, []);

  return { ...state, refresh };
}
