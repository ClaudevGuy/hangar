import { useEffect, useState } from "react";
import {
  fetchVercelDeployments,
  fetchVercelProjects,
  fetchVercelUser,
  type VercelDeployment,
  type VercelProject,
  type VercelUser,
} from "../lib/vercel";
import { createSyncLoop } from "../lib/realtimeSync";

interface State {
  user: VercelUser | null;
  projects: VercelProject[];
  deployments: VercelDeployment[];
  loading: boolean;
  error: string | null;
}

const IDLE: State = {
  user: null,
  projects: [],
  deployments: [],
  loading: false,
  error: null,
};

// Real-time sync loop for Vercel — see realtimeSync.ts. Polls every
// 60s, refetches on tab focus, broadcasts cache updates so every
// consumer (MorningBrew, TodayPanel, LogsModal, drawer) stays in sync.
const sync = createSyncLoop<State>({
  eventName: "hangar-sync-vercel",
  fetch: async (token, signal) => {
    try {
      const [user, projects, deployments] = await Promise.all([
        fetchVercelUser(token, signal),
        fetchVercelProjects(token, signal),
        fetchVercelDeployments(token, signal),
      ]);
      return { user, projects, deployments, loading: false, error: null };
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") throw err;
      const msg = err instanceof Error ? err.message : "Unknown error";
      return { ...IDLE, error: msg };
    }
  },
});

export function useVercelData(token: string | null): State {
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
