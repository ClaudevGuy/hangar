// Morning Brew state — caches a generated narrative per (workspace, day).
//
// Deliberately does NOT auto-fetch on mount. The first brew is always opt-in
// (the user clicks "Brew now") so we never silently spend their Anthropic
// budget. Once generated, today's brew lives in localStorage until the day
// rolls over; manual "Refresh" overwrites the cache.

import { useCallback, useEffect, useState } from "react";
import { generateBrew } from "../lib/brew";
import { workspaceKey } from "../lib/workspaces";
import type { Incident } from "./useIncidents";
import type { ToolMetaMap } from "./useToolMeta";
import type { Tool } from "../types";

export type BrewStatus = "idle" | "loading" | "ready" | "error";

export interface BrewState {
  status: BrewStatus;
  text: string | null;
  generatedAt: number | null;
  // True when the cached text was generated on a previous calendar day —
  // the panel uses this to nudge "refresh for today's briefing".
  isStale: boolean;
  error: string | null;
}

interface CachedBrew {
  text: string;
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
    return { status: "idle", text: null, generatedAt: null, isStale: false, error: null };
  }
  const today = dayKey();
  return {
    status: "ready",
    text: cached.text,
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
}

export interface UseMorningBrewReturn extends BrewState {
  refresh: (signal?: AbortSignal) => Promise<void>;
}

export function useMorningBrew({
  apiKey,
  stackTools,
  toolMeta,
  incidents,
}: UseMorningBrewArgs): UseMorningBrewReturn {
  const [state, setState] = useState<BrewState>(buildInitialState);

  const refresh = useCallback(
    async (signal?: AbortSignal) => {
      if (!apiKey) {
        setState({
          status: "error",
          text: null,
          generatedAt: null,
          isStale: false,
          error: "Add an Anthropic key to brew today's briefing.",
        });
        return;
      }
      setState((prev) => ({ ...prev, status: "loading", error: null }));
      try {
        const text = await generateBrew(
          { stackTools, toolMeta, incidents },
          apiKey,
          signal,
        );
        const generatedAt = Date.now();
        const dk = dayKey();
        writeCache({ text, generatedAt, dayKey: dk });
        setState({ status: "ready", text, generatedAt, isStale: false, error: null });
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
    [apiKey, stackTools, toolMeta, incidents],
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
