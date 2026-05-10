import { useEffect, useState } from "react";
import {
  fetchSentryIssues,
  fetchSentryOrgs,
  type SentryIssue,
  type SentryOrganization,
} from "../lib/sentry";
import { createSyncLoop } from "../lib/realtimeSync";

interface State {
  org: SentryOrganization | null;
  issues: SentryIssue[];
  loading: boolean;
  error: string | null;
}

const IDLE: State = { org: null, issues: [], loading: false, error: null };

// Real-time sync loop for Sentry. Two-step fetch (orgs → issues) lives
// inside the loop so cancellation cascades correctly: aborting the
// signal during the orgs fetch will short-circuit the whole chain.
const sync = createSyncLoop<State>({
  eventName: "hangar-sync-sentry",
  fetch: async (token, signal) => {
    try {
      const orgs = await fetchSentryOrgs(token, signal);
      const org = orgs[0] ?? null;
      const issues = org ? await fetchSentryIssues(org.slug, token, signal) : [];
      return { org, issues, loading: false, error: null };
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") throw err;
      const msg = err instanceof Error ? err.message : "Unknown error";
      return { ...IDLE, error: msg };
    }
  },
});

export function useSentryData(token: string | null): State {
  const [state, setState] = useState<State>(() => {
    if (!token) return IDLE;
    return sync.peek(token) ?? { ...IDLE, loading: true };
  });

  useEffect(() => {
    if (!token) {
      setState(IDLE);
      return;
    }
    const unsubscribe = sync.subscribe(token, setState);
    return unsubscribe;
  }, [token]);

  return state;
}
