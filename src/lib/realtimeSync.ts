// Tiny pub-sub layer that turns a per-token data hook into a real-time
// data source. Each tool's data hook (useGitHubData / useVercelData /
// useSentryData / useLinearData) wraps a single sync loop created here.
//
// Responsibilities:
//   1. Refcount-aware polling — exactly ONE setInterval per token,
//      regardless of how many React components are subscribed. Multiple
//      consumers of useGitHubData(token) share a single fetch.
//   2. Cache broadcast — every refetch updates a token-keyed cache and
//      dispatches a custom event so all subscribers re-render together.
//      Without this, MorningBrew's useIncidents and TodayPanel's
//      useIncidents could show out-of-sync counts for ~60 seconds.
//   3. Immediate refetch on tab focus — when the user returns to the
//      tab after a minimize / cmd-tab, refresh right away rather than
//      waiting for the next interval tick. Background tabs would still
//      appear stale otherwise.
//   4. In-flight cancel — a slow earlier fetch can't clobber a newer
//      one. Each new fetch aborts the prior token's AbortController.
//
// We deliberately do NOT manage React state here — each hook keeps its
// own useState and just routes updates through `subscribe`. That keeps
// this file framework-agnostic and the per-hook code tiny.

const DEFAULT_INTERVAL_MS = 60_000; // 60s — well under every provider's rate limit

export interface SyncLoop<T> {
  // Subscribe a callback for cache updates on a token. Returns an
  // unsubscribe fn. Starts the poll loop on first subscribe for that
  // token; stops it when the last subscriber unsubscribes.
  subscribe: (token: string, callback: (state: T) => void) => () => void;
  // Read current cached state for a token (sync, no fetch). Returns
  // undefined when the token has never been fetched.
  peek: (token: string) => T | undefined;
  // Trigger an immediate refetch — useful for "Refresh now" buttons
  // (Brew uses this; Logs could in the future).
  refresh: (token: string) => Promise<void>;
}

export interface SyncLoopConfig<T> {
  // Fetch function the poller calls. Should NEVER throw — wrap errors
  // into the returned T (e.g. via `error: msg`) so subscribers see the
  // failure state instead of getting a silent re-throw. AbortError IS
  // allowed to propagate; the helper handles cancellation cleanly.
  fetch: (token: string, signal: AbortSignal) => Promise<T>;
  // Polling interval in ms. Defaults to 60_000.
  intervalMs?: number;
  // Unique event name for the broadcast — prevents collisions when
  // multiple sync loops are active in the same window.
  eventName: string;
}

export function createSyncLoop<T>(config: SyncLoopConfig<T>): SyncLoop<T> {
  const cache = new Map<string, T>();
  const refCount = new Map<string, number>();
  const intervals = new Map<string, number>();
  const inFlight = new Map<string, AbortController>();
  const intervalMs = config.intervalMs ?? DEFAULT_INTERVAL_MS;

  async function doFetch(token: string): Promise<void> {
    // Cancel any in-flight request before starting a new one. Without
    // this a slow earlier request that resolves AFTER a newer one would
    // overwrite the fresher cache state.
    inFlight.get(token)?.abort();
    const ac = new AbortController();
    inFlight.set(token, ac);
    try {
      const next = await config.fetch(token, ac.signal);
      // If our controller was replaced while we were waiting, drop the
      // result — a newer fetch is in flight and will commit instead.
      if (inFlight.get(token) !== ac) return;
      cache.set(token, next);
      window.dispatchEvent(new CustomEvent(config.eventName, { detail: token }));
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      // Hooks should shape errors into T, but if one throws by accident
      // we re-throw rather than silently eat it — easier to spot in dev.
      throw err;
    } finally {
      if (inFlight.get(token) === ac) inFlight.delete(token);
    }
  }

  function subscribe(token: string, callback: (state: T) => void): () => void {
    // 1) Wire the broadcast listener so this subscriber stays in sync
    //    with whatever other instance triggered the latest fetch.
    const onUpdate = (e: Event) => {
      const ce = e as CustomEvent<string>;
      if (ce.detail === token) {
        const fresh = cache.get(token);
        if (fresh) callback(fresh);
      }
    };
    window.addEventListener(config.eventName, onUpdate);

    // 2) Refetch immediately when the tab regains focus. The 60s poll
    //    keeps running while hidden, but we don't want a user returning
    //    after lunch to wait 60s for the first fresh data — kick now.
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void doFetch(token);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    // 3) Refcount-managed poll lifecycle. Only the first subscriber
    //    starts the timer; only the last subscriber's unsubscribe
    //    stops it. Everyone in between rides the same loop.
    const prevCount = refCount.get(token) ?? 0;
    refCount.set(token, prevCount + 1);
    if (prevCount === 0) {
      // First subscriber — kick an initial fetch if we have no cache,
      // and start the poll timer. Polls skip while the tab is hidden so
      // backgrounded tabs don't burn rate limits / battery; the
      // visibilitychange handler below will fire an immediate refetch
      // the moment the user returns to the tab.
      if (!cache.has(token)) {
        void doFetch(token);
      }
      const id = window.setInterval(() => {
        if (document.visibilityState === "visible") {
          void doFetch(token);
        }
      }, intervalMs);
      intervals.set(token, id);
    }

    // 4) Sync the new subscriber to whatever's currently cached so it
    //    doesn't have to wait for the next tick to render real data.
    const cached = cache.get(token);
    if (cached) callback(cached);

    return () => {
      window.removeEventListener(config.eventName, onUpdate);
      document.removeEventListener("visibilitychange", onVisibility);
      const cur = (refCount.get(token) ?? 1) - 1;
      refCount.set(token, Math.max(0, cur));
      if (cur <= 0) {
        const id = intervals.get(token);
        if (id != null) window.clearInterval(id);
        intervals.delete(token);
        inFlight.get(token)?.abort();
        inFlight.delete(token);
      }
    };
  }

  return {
    subscribe,
    peek: (token: string) => cache.get(token),
    refresh: doFetch,
  };
}
