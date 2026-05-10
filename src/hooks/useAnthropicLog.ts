// React subscription to the Anthropic call log. Re-renders when:
//   - any Anthropic call site records a new event (custom event)
//   - another tab modifies the storage key (native StorageEvent)
//
// Used by useIncidents (which forwards into Stack Pulse + Logs) so the
// dashboard updates the moment a Brief / Brew / Ask turn / Investigate
// completes — no page reload, no polling.

import { useEffect, useState } from "react";
import {
  ANTHROPIC_LOG_CHANGE,
  readAnthropicEvents,
  type AnthropicEvent,
} from "../lib/anthropicLog";

export function useAnthropicLog(): AnthropicEvent[] {
  const [events, setEvents] = useState<AnthropicEvent[]>(() => readAnthropicEvents());

  useEffect(() => {
    const onLocal = () => setEvents(readAnthropicEvents());
    const onStorage = (e: StorageEvent) => {
      // Workspace-scoped — match the prefix not the exact key.
      if (e.key && e.key.startsWith("hangar-anthropic-log-")) {
        setEvents(readAnthropicEvents());
      }
    };
    window.addEventListener(ANTHROPIC_LOG_CHANGE, onLocal);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(ANTHROPIC_LOG_CHANGE, onLocal);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return events;
}
