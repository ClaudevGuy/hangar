import { useEffect, useState } from "react";
import { fetchGitHubRepos, fetchGitHubUser, type GitHubRepo, type GitHubUser } from "../lib/github";

interface State {
  user: GitHubUser | null;
  repos: GitHubRepo[];
  loading: boolean;
  error: string | null;
}

const IDLE: State = { user: null, repos: [], loading: false, error: null };

// Per-token in-memory cache lives for the page's lifetime — reopen the drawer
// without burning rate limit. The vault stores the token, not us.
const cache = new Map<string, State>();

export function useGitHubData(token: string | null): State {
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
      fetchGitHubUser(token, ac.signal),
      fetchGitHubRepos(token, ac.signal),
    ])
      .then(([user, repos]) => {
        const next: State = { user, repos, loading: false, error: null };
        cache.set(token, next);
        setState(next);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        const msg = err instanceof Error ? err.message : "Unknown error";
        setState({ user: null, repos: [], loading: false, error: msg });
      });
    return () => ac.abort();
  }, [token]);

  return state;
}
