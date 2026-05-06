import { useEffect, useState } from "react";
import {
  fetchResendDomains,
  fetchResendEmails,
  type ResendDomain,
  type ResendEmail,
} from "../lib/resend";

interface State {
  emails: ResendEmail[];
  domains: ResendDomain[];
  loading: boolean;
  error: string | null;
}

const IDLE: State = { emails: [], domains: [], loading: false, error: null };

// Per-token in-memory cache so re-opening the drawer doesn't refetch.
const cache = new Map<string, State>();

export function useResendData(token: string | null): State {
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
      fetchResendEmails(token, ac.signal),
      fetchResendDomains(token, ac.signal),
    ])
      .then(([emails, domains]) => {
        const next: State = { emails, domains, loading: false, error: null };
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
