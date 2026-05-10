import { useEffect, useState } from "react";
import {
  fetchLinearIssues,
  fetchLinearViewer,
  type LinearIssue,
  type LinearViewer,
} from "../lib/linear";
import { createSyncLoop } from "../lib/realtimeSync";

interface State {
  viewer: LinearViewer | null;
  issues: LinearIssue[];
  loading: boolean;
  error: string | null;
}

const IDLE: State = { viewer: null, issues: [], loading: false, error: null };

// Real-time sync loop for Linear. Polls every 60s, refetches on tab
// focus, broadcasts cache updates to all consumers — see realtimeSync.ts
// for the full mechanism.
const sync = createSyncLoop<State>({
  eventName: "hangar-sync-linear",
  fetch: async (token, signal) => {
    try {
      const [viewer, issues] = await Promise.all([
        fetchLinearViewer(token, signal),
        fetchLinearIssues(token, signal),
      ]);
      return { viewer, issues, loading: false, error: null };
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") throw err;
      const msg = err instanceof Error ? err.message : "Unknown error";
      return { ...IDLE, error: msg };
    }
  },
});

export function useLinearData(token: string | null): State {
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
