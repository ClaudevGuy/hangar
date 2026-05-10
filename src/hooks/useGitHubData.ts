import { useEffect, useState } from "react";
import {
  fetchGitHubEvents,
  fetchGitHubRepos,
  fetchGitHubUser,
  type GitHubEvent,
  type GitHubRepo,
  type GitHubUser,
} from "../lib/github";
import { createSyncLoop } from "../lib/realtimeSync";

interface State {
  user: GitHubUser | null;
  repos: GitHubRepo[];
  // Per-event activity feed — used by Stack Pulse + Logs to draw real
  // commit-by-commit / PR-by-PR records instead of collapsing everything
  // to a single repo-level pushed_at.
  events: GitHubEvent[];
  loading: boolean;
  error: string | null;
}

const IDLE: State = { user: null, repos: [], events: [], loading: false, error: null };

// Single sync loop shared across every consumer of useGitHubData. The
// helper handles polling, refcount, cancel, tab-focus refresh, and
// broadcasting cache updates. We just supply the fetch + a unique event
// name. Errors get shaped INTO the State so subscribers see the failure
// instead of an unhandled throw.
const sync = createSyncLoop<State>({
  eventName: "hangar-sync-github",
  fetch: async (token, signal) => {
    try {
      const [user, repos] = await Promise.all([
        fetchGitHubUser(token, signal),
        fetchGitHubRepos(token, signal),
      ]);
      // Events are best-effort: a 403 (token lacking the right scope) or
      // 422 shouldn't blank the drawer. Empty events array → Stack Pulse
      // falls back to repo pushed_at signal.
      let events: GitHubEvent[] = [];
      try {
        events = await fetchGitHubEvents(user.login, token, signal);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") throw err;
        console.warn("github events fetch failed", err);
      }
      return { user, repos, events, loading: false, error: null };
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") throw err;
      const msg = err instanceof Error ? err.message : "Unknown error";
      return { user: null, repos: [], events: [], loading: false, error: msg };
    }
  },
});

export function useGitHubData(token: string | null): State {
  const [state, setState] = useState<State>(() => {
    if (!token) return IDLE;
    // If another consumer already populated the cache, jump straight to
    // it. Otherwise show loading until the first fetch lands.
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
