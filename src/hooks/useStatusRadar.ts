import { useEffect, useState } from "react";
import {
  STATUS_PAGES,
  fetchProviderStatus,
  type ProviderStatus,
} from "../lib/statusRadar";
import type { Tool } from "../types";

const REFRESH_MS = 5 * 60 * 1000; // 5 minutes — status pages don't change often

export interface UseStatusRadarReturn {
  statuses: ProviderStatus[];
  loading: boolean;
}

// Fetches public status pages for any pinned tool that has an entry in
// STATUS_PAGES. Refreshes every 5 minutes. Returns one entry per checkable
// tool (failed fetches still surface as "unknown" so the radar stays
// rendered with a placeholder dot rather than disappearing).
export function useStatusRadar(stackTools: Tool[]): UseStatusRadarReturn {
  const [statuses, setStatuses] = useState<ProviderStatus[]>([]);
  const [loading, setLoading] = useState(true);

  // Stable cache key for the effect — only re-runs when the pinned set of
  // status-checkable tools actually changes.
  const checkableIds = stackTools
    .map((t) => t.id)
    .filter((id) => !!STATUS_PAGES[id])
    .sort()
    .join(",");

  useEffect(() => {
    if (!checkableIds) {
      setStatuses([]);
      setLoading(false);
      return;
    }
    const ids = checkableIds.split(",");
    const ac = new AbortController();
    let cancelled = false;

    const refresh = async () => {
      const results = await Promise.all(
        ids.map((id) =>
          fetchProviderStatus(id, ac.signal).catch((err: unknown) => {
            if (err instanceof DOMException && err.name === "AbortError") return null;
            return null;
          }),
        ),
      );
      if (cancelled) return;
      const valid = results.filter((r): r is ProviderStatus => r !== null);
      setStatuses(valid);
      setLoading(false);
    };

    setLoading(true);
    void refresh();
    const interval = window.setInterval(() => void refresh(), REFRESH_MS);

    return () => {
      cancelled = true;
      ac.abort();
      window.clearInterval(interval);
    };
  }, [checkableIds]);

  return { statuses, loading };
}
