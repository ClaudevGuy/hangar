// React subscription to the universal tool-launch log. Re-renders when:
//   - launch is recorded in this tab (custom event from launchLog.ts)
//   - another tab modifies the storage key (native StorageEvent)
//
// Used by useIncidents which forwards into Stack Pulse + Logs so the
// dashboard updates the moment the user opens any tool.

import { useEffect, useState } from "react";
import {
  LAUNCH_LOG_CHANGE,
  readLaunchEvents,
  type LaunchEvent,
} from "../lib/launchLog";

export function useLaunchLog(): LaunchEvent[] {
  const [events, setEvents] = useState<LaunchEvent[]>(() => readLaunchEvents());

  useEffect(() => {
    const onLocal = () => setEvents(readLaunchEvents());
    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key.startsWith("hangar-launch-log-")) {
        setEvents(readLaunchEvents());
      }
    };
    window.addEventListener(LAUNCH_LOG_CHANGE, onLocal);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(LAUNCH_LOG_CHANGE, onLocal);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return events;
}
