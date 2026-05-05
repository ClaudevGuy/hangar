import { useEffect, useState } from "react";
import {
  fetchLinearIssues,
  fetchLinearViewer,
  type LinearIssue,
  type LinearViewer,
} from "../lib/linear";

interface State {
  viewer: LinearViewer | null;
  issues: LinearIssue[];
  loading: boolean;
  error: string | null;
}

const IDLE: State = { viewer: null, issues: [], loading: false, error: null };
const cache = new Map<string, State>();

export function useLinearData(token: string | null): State {
  const [state, setState] = useState<State>(() => {
    if (!token) return IDLE;
    return cache.get(token) ?? { ...IDLE, loading: true };
  });

  useEffect(() => {
    if (!token) {
      setState(IDLE);
      return;
    }
    const cached = cache.get(token);
    if (cached) {
      setState(cached);
      return;
    }
    const ac = new AbortController();
    setState({ ...IDLE, loading: true });
    Promise.all([fetchLinearViewer(token, ac.signal), fetchLinearIssues(token, ac.signal)])
      .then(([viewer, issues]) => {
        const next: State = { viewer, issues, loading: false, error: null };
        cache.set(token, next);
        setState(next);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        const msg = err instanceof Error ? err.message : "Unknown error";
        setState({ viewer: null, issues: [], loading: false, error: msg });
      });
    return () => ac.abort();
  }, [token]);

  return state;
}
