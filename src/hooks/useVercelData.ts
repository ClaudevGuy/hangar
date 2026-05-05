import { useEffect, useState } from "react";
import {
  fetchVercelDeployments,
  fetchVercelProjects,
  fetchVercelUser,
  type VercelDeployment,
  type VercelProject,
  type VercelUser,
} from "../lib/vercel";

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

const cache = new Map<string, State>();

export function useVercelData(token: string | null): State {
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
    Promise.all([
      fetchVercelUser(token, ac.signal),
      fetchVercelProjects(token, ac.signal),
      fetchVercelDeployments(token, ac.signal),
    ])
      .then(([user, projects, deployments]) => {
        const next: State = { user, projects, deployments, loading: false, error: null };
        cache.set(token, next);
        setState(next);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        const msg = err instanceof Error ? err.message : "Unknown error";
        setState({ ...IDLE, error: msg });
      });
    return () => ac.abort();
  }, [token]);

  return state;
}
