import { useEffect } from "react";
import { Icon } from "../lib/icons";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CheatSheet({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="cheat-sheet" onClick={(e) => e.stopPropagation()}>
        <header className="cheat-head">
          <h2>Keyboard shortcuts</h2>
          <button type="button" className="drawer-x" onClick={onClose} aria-label="Close">
            <Icon.close />
          </button>
        </header>
        <div className="cheat-body">
          <Section title="Navigation">
            <Row keys={["?"]} desc="Open this cheat sheet" />
            <Row keys={["/"]} desc="Focus catalog search" />
            <Row keys={["⌘", "K"]} desc="Command palette" />
            <Row keys={["⌘", "⇧", "F"]} desc="Stack-wide search (every connected tool)" />
            <Row keys={["Esc"]} desc="Close popovers, blur inputs" />
          </Section>
          <Section title="Go to">
            <Row keys={["g", "g"]} desc="Top of page" />
            <Row keys={["g", "t"]} desc="Today panel" />
            <Row keys={["g", "1–9"]} desc="Launch pinned tool 1–9" />
          </Section>
        </div>
        <footer className="cheat-foot muted">
          Power-user mode. More chords on the way.
        </footer>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="cheat-section">
      <div className="cheat-section-label">{title}</div>
      <div className="cheat-rows">{children}</div>
    </div>
  );
}

function Row({ keys, desc }: { keys: string[]; desc: string }) {
  return (
    <div className="cheat-row">
      <div className="cheat-keys">
        {keys.map((k, i) => (
          <span key={i} className="cheat-kbd">
            {k}
          </span>
        ))}
      </div>
      <div className="cheat-desc">{desc}</div>
    </div>
  );
}

interface ChordIndicatorProps {
  chord: string | null;
}

// Small floating indicator that shows the active chord prefix (e.g. "g…")
// at the bottom-left while the user's mid-chord. Linear has the same.
export function ChordIndicator({ chord }: ChordIndicatorProps) {
  if (!chord) return null;
  return (
    <div className="chord-indicator" aria-hidden="true">
      {chord}…
    </div>
  );
}
