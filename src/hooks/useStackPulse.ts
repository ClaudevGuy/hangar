// Stack Pulse — derives a 24-hour hourly activity waveform per pinned tool
// from the same incident feed the Inbox panel uses. No additional fetches:
// useIncidents is per-token cached, so calling it here AND in TodayPanel
// hits the same cached state.

import { useMemo } from "react";
import type { IncidentFeed } from "./useIncidents";
import type { Tool } from "../types";

export interface PulseTrack {
  toolId: string;
  // 24 entries, oldest → newest (index 0 = 23h ago, index 23 = the past hour).
  buckets: number[];
  // Matching error markers — true when any event in the bucket is severe
  // enough to render as a red bar.
  errorBuckets: boolean[];
  totalActivity: number;
  hasErrors: boolean;
}

const HOURS = 24;
const BUCKET_MS = 60 * 60 * 1000;

export function useStackPulse(stackTools: Tool[], feed: IncidentFeed): PulseTrack[] {
  return useMemo(() => {
    const now = Date.now();
    const start = now - HOURS * BUCKET_MS;

    const tracks: PulseTrack[] = [];

    for (const tool of stackTools) {
      const buckets = new Array<number>(HOURS).fill(0);
      const errorBuckets = new Array<boolean>(HOURS).fill(false);

      const bumpBucket = (timestamp: number, isErr: boolean) => {
        if (timestamp < start || timestamp > now) return;
        const idx = Math.min(HOURS - 1, Math.floor((timestamp - start) / BUCKET_MS));
        buckets[idx]++;
        if (isErr) errorBuckets[idx] = true;
      };

      // Each provider plugs into the bucket grid the same way — derive a
      // timestamp + an "is this a problem" flag, then bump.
      if (tool.id === "vercel") {
        for (const d of feed.vercelDeployments) {
          const isErr = d.state === "ERROR" || d.state === "CANCELED";
          bumpBucket(d.created, isErr);
        }
      } else if (tool.id === "sentry") {
        for (const issue of feed.sentryIssues) {
          const t = new Date(issue.lastSeen).getTime();
          const isErr = issue.level === "error" || issue.level === "fatal";
          bumpBucket(t, isErr);
        }
      } else if (tool.id === "linear") {
        for (const issue of feed.linearIssues) {
          const t = new Date(issue.updatedAt).getTime();
          const isErr = issue.priority === 1; // urgent
          bumpBucket(t, isErr);
        }
      } else if (tool.id === "anthropic") {
        // Hangar's own Brief / Brew / Ask / Investigate calls. Anthropic
        // doesn't expose a public per-key activity feed, so we log calls
        // locally (lib/anthropicLog.ts) and surface them here. Without
        // this branch the Anthropic Pulse cell would always render
        // "QUIET" even when it's secretly doing most of the work.
        for (const ev of feed.anthropicEvents) {
          bumpBucket(ev.timestamp, false);
        }
      } else if (tool.id === "github") {
        // Prefer the per-event /users/:user/events feed (each push, PR,
        // issue, etc. has its own created_at second-level timestamp) over
        // the repo-level pushed_at (which collapses every push on a repo
        // into a single bar and hides intra-day bursts). Fall back to
        // repo pushed_at if the events fetch was rate-limited / scoped
        // out — the cell still shows SOME signal instead of always quiet.
        if (feed.githubEvents.length > 0) {
          for (const ev of feed.githubEvents) {
            const t = new Date(ev.created_at).getTime();
            bumpBucket(t, false);
          }
        } else {
          for (const repo of feed.githubRepos) {
            const t = new Date(repo.pushed_at).getTime();
            bumpBucket(t, false);
          }
        }
      }
      // Other tools have no live data plumbed through useIncidents — they
      // render a flat dotted "no signal" baseline below. Keeping them in the
      // tracks list is intentional: it shows the FULL pinned stack, not just
      // the providers we happen to fetch.

      const totalActivity = buckets.reduce((a, b) => a + b, 0);
      const hasErrors = errorBuckets.some(Boolean);
      tracks.push({ toolId: tool.id, buckets, errorBuckets, totalActivity, hasErrors });
    }

    return tracks;
  }, [stackTools, feed]);
}
