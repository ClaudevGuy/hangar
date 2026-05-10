import { useEffect, useState } from "react";
import {
  fetchGitHubEvents,
  fetchGitHubRepos,
  fetchGitHubUser,
  type GitHubEvent,
  type GitHubRepo,
  type GitHubUser,
} from "../lib/github";

interface State {
  user: GitHubUser | null;
  repos: GitHubRepo[];
  // Per-event activity feed — used by Stack Pulse to draw real
  // commit-by-commit / PR-by-PR waveform bars instead of collapsing
  // everything to a single repo-level pushed_at. Empty when the events
  // fetch fails (we don't want one failed sub-request to nuke the whole
  // hook — repos still render in the drawer).
  events: GitHubEvent[];
  loading: boolean;
  error: string | null;
}

const IDLE: State = { user: null, repos: [], events: [], loading: false, error: null };

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
    // First fetch user + repos in parallel — both needed for the drawer.
    // Events come from /users/:username/events so we can't fire it until
    // we know the username; chain it after user resolves.
    Promise.all([
      fetchGitHubUser(token, ac.signal),
      fetchGitHubRepos(token, ac.signal),
    ])
      .then(async ([user, repos]) => {
        // Events are best-effort — swallow failures so a /events 403 (rare
        // but possible on tokens lacking the right scope) doesn't blank
        // the whole drawer. Empty events array just means the Pulse
        // sparkline falls back to the repo pushed_at signal (still 0–N
        // bars depending on how many repos were pushed in the window).
        let events: GitHubEvent[] = [];
        try {
          events = await fetchGitHubEvents(user.login, token, ac.signal);
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") throw err;
          // log + continue
          console.warn("github events fetch failed", err);
        }
        const next: State = { user, repos, events, loading: false, error: null };
        cache.set(token, next);
        setState(next);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        const msg = err instanceof Error ? err.message : "Unknown error";
        setState({ user: null, repos: [], events: [], loading: false, error: msg });
      });
    return () => ac.abort();
  }, [token]);

  return state;
}
