// Privacy / screensharing mode — blurs sensitive on-screen data (API keys,
// repo names, issue titles, workspace names) so the user can demo Hangar or
// share their screen without leaking real identifiers.
//
// Stored at the GLOBAL key "hangar-privacy-mode" (not workspace-scoped) —
// it's a per-device behavioural preference, not stack-related state. A user
// who flips it on before a Zoom call doesn't want to re-flip it every time
// they switch workspaces.
//
// Cross-tab sync via the native `storage` event so flipping it on in one
// tab updates every other open Hangar tab immediately.

import { useEffect, useState } from "react";

const STORAGE_KEY = "hangar-privacy-mode";

function read(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function write(on: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, on ? "1" : "0");
  } catch {
    // localStorage disabled — preference just doesn't persist this session.
  }
}

export interface UsePrivacyModeReturn {
  privacyMode: boolean;
  setPrivacyMode: (on: boolean) => void;
  togglePrivacyMode: () => void;
}

export function usePrivacyMode(): UsePrivacyModeReturn {
  const [privacyMode, setOn] = useState<boolean>(() => read());

  useEffect(() => {
    write(privacyMode);
  }, [privacyMode]);

  // Cross-tab sync — when another tab toggles, we follow.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      setOn(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return {
    privacyMode,
    setPrivacyMode: setOn,
    togglePrivacyMode: () => setOn((s) => !s),
  };
}
