import { useCallback, useEffect, useRef, useState } from "react";
import {
  applySyncBlob,
  buildSyncBlob,
  findOrCreateHangarGist,
  pullGist,
  pushGist,
} from "../lib/gistSync";

export type SyncStatus = "off" | "idle" | "syncing" | "error";

interface SyncState {
  status: SyncStatus;
  gistId: string | null;
  lastSyncedAt: number | null;
  error: string | null;
}

const GIST_ID_KEY = "hangar-sync-gist-id";
const LAST_SYNC_KEY = "hangar-sync-last";

const PUSH_DEBOUNCE_MS = 4000;

interface UseGistSyncReturn extends SyncState {
  setUp: (token: string) => Promise<void>;
  pushNow: (token: string) => Promise<void>;
  pullNow: (token: string) => Promise<void>;
  disconnect: () => void;
}

export function useGistSync(): UseGistSyncReturn {
  const [state, setState] = useState<SyncState>(() => {
    const id = localStorage.getItem(GIST_ID_KEY);
    const last = Number(localStorage.getItem(LAST_SYNC_KEY) || "0");
    return {
      status: id ? "idle" : "off",
      gistId: id,
      lastSyncedAt: last || null,
      error: null,
    };
  });

  // Token + ID held in refs so debounce closures see the latest.
  const tokenRef = useRef<string | null>(null);
  const debounceRef = useRef<number | null>(null);

  const persistLast = (ts: number) => {
    localStorage.setItem(LAST_SYNC_KEY, String(ts));
  };

  const pushNow = useCallback<UseGistSyncReturn["pushNow"]>(
    async (token) => {
      const id = localStorage.getItem(GIST_ID_KEY);
      if (!id) return;
      tokenRef.current = token;
      setState((s) => ({ ...s, status: "syncing", error: null }));
      try {
        const blob = buildSyncBlob();
        await pushGist(token, id, blob);
        const ts = Date.now();
        persistLast(ts);
        setState((s) => ({ ...s, status: "idle", lastSyncedAt: ts, error: null }));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Push failed";
        setState((s) => ({ ...s, status: "error", error: msg }));
      }
    },
    [],
  );

  const pullNow = useCallback<UseGistSyncReturn["pullNow"]>(
    async (token) => {
      const id = localStorage.getItem(GIST_ID_KEY);
      if (!id) return;
      tokenRef.current = token;
      setState((s) => ({ ...s, status: "syncing", error: null }));
      try {
        const blob = await pullGist(token, id);
        applySyncBlob(blob);
        const ts = Date.now();
        persistLast(ts);
        setState((s) => ({ ...s, status: "idle", lastSyncedAt: ts, error: null }));
        // Reload so every persistence hook reads the just-applied data.
        window.location.reload();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Pull failed";
        setState((s) => ({ ...s, status: "error", error: msg }));
      }
    },
    [],
  );

  const setUp = useCallback<UseGistSyncReturn["setUp"]>(async (token) => {
    tokenRef.current = token;
    setState((s) => ({ ...s, status: "syncing", error: null }));
    try {
      const initial = buildSyncBlob();
      const { id, created } = await findOrCreateHangarGist(token, initial);
      localStorage.setItem(GIST_ID_KEY, id);
      // If we discovered an existing gist, prefer the remote — pull it now
      // so this device matches whatever the user last had on another machine.
      if (!created) {
        const blob = await pullGist(token, id);
        applySyncBlob(blob);
        const ts = Date.now();
        persistLast(ts);
        setState({
          status: "idle",
          gistId: id,
          lastSyncedAt: ts,
          error: null,
        });
        window.location.reload();
        return;
      }
      // Brand new gist — local already matches.
      const ts = Date.now();
      persistLast(ts);
      setState({
        status: "idle",
        gistId: id,
        lastSyncedAt: ts,
        error: null,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Setup failed";
      setState((s) => ({ ...s, status: "error", error: msg }));
    }
  }, []);

  const disconnect = useCallback<UseGistSyncReturn["disconnect"]>(() => {
    localStorage.removeItem(GIST_ID_KEY);
    localStorage.removeItem(LAST_SYNC_KEY);
    setState({ status: "off", gistId: null, lastSyncedAt: null, error: null });
  }, []);

  // Listen for our app-internal "data changed" events and push (debounced).
  useEffect(() => {
    if (state.status === "off") return;
    const onChange = () => {
      if (!tokenRef.current) return;
      if (debounceRef.current != null) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => {
        const token = tokenRef.current;
        if (token) void pushNow(token);
      }, PUSH_DEBOUNCE_MS);
    };
    window.addEventListener("hangar:data-changed", onChange);
    return () => {
      window.removeEventListener("hangar:data-changed", onChange);
      if (debounceRef.current != null) window.clearTimeout(debounceRef.current);
    };
  }, [state.status, pushNow]);

  return { ...state, setUp, pushNow, pullNow, disconnect };
}

// Helper for hooks/components that mutate sync-relevant state.
export function notifyDataChanged(): void {
  window.dispatchEvent(new CustomEvent("hangar:data-changed"));
}
