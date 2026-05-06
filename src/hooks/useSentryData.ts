import { useEffect, useState } from "react";
import {
  fetchSentryIssues,
  fetchSentryOrgs,
  type SentryIssue,
  type SentryOrganization,
} from "../lib/sentry";

interface State {
  org: SentryOrganization | null;
  issues: SentryIssue[];
  loading: boolean;
  error: string | null;
}

const IDLE: State = { org: null, issues: [], loading: false, error: null };

// Per-token in-memory cache so re-opening the drawer doesn't refetch.
const cache = new Map<string, State>();

export function useSentryData(token: string | null): State {
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
    (async () => {
      try {
        const orgs = await fetchSentryOrgs(token, ac.signal);
        const org = orgs[0] ?? null;
        const issues = org ? await fetchSentryIssues(org.slug, token, ac.signal) : [];
        const next: State = { org, issues, loading: false, error: null };
        cache.set(token, next);
        setState(next);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        const msg = err instanceof Error ? err.message : "Unknown error";
        setState({ ...IDLE, error: msg });
      }
    })();
    return () => ac.abort();
  }, [token]);

  return state;
}
