import { useEffect, useRef, useState } from "react";

export interface KeyboardShortcutHandlers {
  onOpenCheatSheet: () => void;
  onLaunchToolByIndex: (index: number) => void;
  onScrollToTop: () => void;
  onScrollToToday: () => void;
}

// Linear/GitHub-style chord shortcuts. Tracks a "g"-prefix chord state and
// dispatches single-key + chord actions to the supplied handlers. Skips
// processing while the user is typing in an input, textarea, or
// contenteditable element. Modifier-key combos are left to the browser.
export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  const [chord, setChord] = useState<string | null>(null);
  // Stash handlers on a ref so the keydown listener never re-registers when
  // they change — re-registering mid-chord would clear the prefix.
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    let chordTimer: number | null = null;
    let currentChord: string | null = null;

    const clearChord = () => {
      if (chordTimer != null) {
        window.clearTimeout(chordTimer);
        chordTimer = null;
      }
      currentChord = null;
      setChord(null);
    };

    const startChord = (prefix: string) => {
      currentChord = prefix;
      setChord(prefix);
      if (chordTimer != null) window.clearTimeout(chordTimer);
      // Auto-clear if no follow-up key arrives in 1.5s.
      chordTimer = window.setTimeout(clearChord, 1500);
    };

    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const isTyping =
        tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable === true;

      if (isTyping) {
        // Esc still blurs the input, so users have a way out.
        if (e.key === "Escape" && target) target.blur();
        return;
      }

      // Don't fight modifier-key combos — they belong to the browser/OS.
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      // Handle a pending chord first.
      if (currentChord === "g") {
        if (e.key >= "1" && e.key <= "9") {
          e.preventDefault();
          handlersRef.current.onLaunchToolByIndex(parseInt(e.key, 10) - 1);
          clearChord();
          return;
        }
        if (e.key === "g") {
          e.preventDefault();
          handlersRef.current.onScrollToTop();
          clearChord();
          return;
        }
        if (e.key === "t") {
          e.preventDefault();
          handlersRef.current.onScrollToToday();
          clearChord();
          return;
        }
        // Unknown follow-up — drop the chord and fall through so the key
        // can still trigger a single-key shortcut.
        clearChord();
      }

      // Single-key shortcuts.
      if (e.key === "?") {
        e.preventDefault();
        handlersRef.current.onOpenCheatSheet();
        return;
      }
      if (e.key === "/") {
        e.preventDefault();
        const search = document.getElementById("hangar-search") as HTMLInputElement | null;
        if (search) {
          search.focus();
          search.select();
        }
        return;
      }
      if (e.key === "g") {
        e.preventDefault();
        startChord("g");
        return;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (chordTimer != null) window.clearTimeout(chordTimer);
    };
  }, []);

  return { chordPrefix: chord };
}
