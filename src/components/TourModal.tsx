import { useCallback, useEffect, useState } from "react";
import { TOOLS } from "../data/tools";
import { Icon } from "../lib/icons";
import { ToolLogo } from "./ToolLogo";

interface Props {
  onClose: () => void;
  onOpenStarters: () => void;
}

const TOTAL_STEPS = 6;

// First-run guided tour. Two-column premium card layout: a styled mock visual
// on the left, explainer copy on the right. Six steps total — Welcome, Pin,
// Vault, Watch, AI, then a Get Started action card.
export function TourModal({ onClose, onOpenStarters }: Props) {
  const [step, setStep] = useState(0);

  const goNext = useCallback(() => {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }, []);
  const goBack = useCallback(() => {
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  const handleStart = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleStarter = useCallback(() => {
    onClose();
    onOpenStarters();
  }, [onClose, onOpenStarters]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goBack();
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (step === TOTAL_STEPS - 1) handleStart();
        else goNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, goNext, goBack, handleStart, onClose]);

  const isLast = step === TOTAL_STEPS - 1;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="tour-modal" onClick={(e) => e.stopPropagation()}>
        <header className="tour-head">
          <div className="tour-dots" role="tablist" aria-label="Tour progress">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <button
                key={i}
                type="button"
                className={`tour-dot${i === step ? " is-active" : ""}${i < step ? " is-past" : ""}`}
                onClick={() => setStep(i)}
                aria-label={`Step ${i + 1} of ${TOTAL_STEPS}`}
                aria-selected={i === step}
                role="tab"
              />
            ))}
          </div>
          <button type="button" className="tour-skip" onClick={onClose} aria-label="Skip tour">
            Skip <Icon.close />
          </button>
        </header>

        <div className="tour-body">
          <div className="tour-visual">
            <Visual step={step} />
          </div>
          <div className="tour-content">
            <Content step={step} onOpenStarters={handleStarter} onClose={handleStart} />
          </div>
        </div>

        <footer className="tour-foot">
          <button
            type="button"
            className="tour-btn tour-btn-ghost"
            onClick={goBack}
            disabled={step === 0}
          >
            ← Back
          </button>
          <div className="tour-foot-meta muted">
            <kbd>←</kbd> <kbd>→</kbd> to navigate · <kbd>Esc</kbd> to skip
          </div>
          {isLast ? (
            <button type="button" className="tour-btn tour-btn-primary" onClick={handleStart}>
              Get started ✦
            </button>
          ) : (
            <button type="button" className="tour-btn tour-btn-primary" onClick={goNext}>
              Next →
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

// ── Per-step visuals ────────────────────────────────────────────────

function Visual({ step }: { step: number }) {
  switch (step) {
    case 0:
      return <WelcomeVisual />;
    case 1:
      return <PinVisual />;
    case 2:
      return <VaultVisual />;
    case 3:
      return <TodayVisual />;
    case 4:
      return <AiVisual />;
    case 5:
      return <ReadyVisual />;
    default:
      return null;
  }
}

const SHOWCASE_IDS = ["vercel", "neon", "stripe", "sentry", "linear", "anthropic"];

function WelcomeVisual() {
  const tools = SHOWCASE_IDS.map((id) => TOOLS.find((t) => t.id === id)).filter(Boolean) as typeof TOOLS;
  return (
    <div className="tour-vis tour-vis-welcome">
      <div className="tour-vis-glow" />
      <div className="tour-vis-cluster">
        {tools.map((t, i) => (
          <div
            key={t.id}
            className="tour-vis-orbit"
            style={{
              "--i": i,
              "--n": tools.length,
            } as React.CSSProperties}
          >
            <ToolLogo tool={t} size={42} />
          </div>
        ))}
        <div className="tour-vis-center">
          <svg viewBox="0 0 32 32" width="34" height="34" fill="none" stroke="currentColor" strokeWidth={2.4}>
            <path d="M4 24 16 6l12 18M4 24h24M9 24v-6h14v6" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function PinVisual() {
  const tools = ["vercel", "neon", "stripe", "sentry"]
    .map((id) => TOOLS.find((t) => t.id === id))
    .filter(Boolean) as typeof TOOLS;
  return (
    <div className="tour-vis tour-vis-pin">
      <div className="tour-mock-catalog">
        {tools.map((t, i) => (
          <div key={t.id} className={`tour-mock-tile${i === 0 ? " is-pinned" : ""}`}>
            <ToolLogo tool={t} size={28} />
            <div className="tour-mock-tile-name">{t.name}</div>
            <div className={`tour-mock-tile-cta${i === 0 ? " is-pinned" : ""}`}>
              {i === 0 ? "✓ PINNED" : "PIN +"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VaultVisual() {
  return (
    <div className="tour-vis tour-vis-vault">
      <div className="tour-mock-vault">
        <div className="tour-mock-vault-head">
          <div>
            <div className="tour-mock-vault-eyebrow">The vault</div>
            <div className="tour-mock-vault-title">Keys</div>
          </div>
          <div className="tour-mock-vault-pill">🔒 LOCAL ONLY</div>
        </div>
        <ul className="tour-mock-vault-list">
          <li>
            <span className="tour-mock-vault-name">GitHub</span>
            <span className="tour-mock-vault-secret">ghp_•••••••••</span>
          </li>
          <li>
            <span className="tour-mock-vault-name">Vercel</span>
            <span className="tour-mock-vault-secret">•••••••••••••</span>
          </li>
          <li>
            <span className="tour-mock-vault-name">Anthropic</span>
            <span className="tour-mock-vault-secret">sk-ant-•••••</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function TodayVisual() {
  const rows: { sev: "critical" | "warning" | "info"; title: string; time: string }[] = [
    { sev: "critical", title: "hangar · deploy failed", time: "12m" },
    { sev: "critical", title: "TypeError in checkout.tsx · 47 events", time: "1h" },
    { sev: "warning", title: "Vercel: investigating elevated 5xx", time: "now" },
  ];
  return (
    <div className="tour-vis tour-vis-today">
      <div className="tour-mock-today">
        <div className="tour-mock-today-head">
          <span>Today</span>
          <span className="muted">3 to look at</span>
        </div>
        {rows.map((row, i) => (
          <div key={i} className={`tour-mock-today-row sev-${row.sev}`}>
            <span className="tour-mock-today-dot" />
            <span className="tour-mock-today-title">{row.title}</span>
            <span className="tour-mock-today-time">{row.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AiVisual() {
  return (
    <div className="tour-vis tour-vis-ai">
      <div className="tour-mock-brief">
        <div className="tour-mock-brief-head">
          <span className="tour-mock-brief-spark">✦</span>
          <span>BRIEF · GENERATED 2M AGO</span>
        </div>
        <div className="tour-mock-brief-status">
          <span className="tour-mock-brief-dot" />
          <span>WATCH</span>
        </div>
        <p className="tour-mock-brief-headline">
          <strong>Vercel</strong> v2.4.1 deployed 18m before this <strong>Sentry</strong> error first appeared.
        </p>
        <div className="tour-mock-brief-rec">
          <div className="tour-mock-brief-rec-label">Recommended action</div>
          <div className="tour-mock-brief-rec-body">Roll back v2.4.1 or push a hotfix to checkout.tsx.</div>
        </div>
      </div>
    </div>
  );
}

function ReadyVisual() {
  return (
    <div className="tour-vis tour-vis-ready">
      <div className="tour-vis-glow" />
      <div className="tour-vis-ready-spark">✦</div>
      <div className="tour-vis-ready-text">Ready when you are.</div>
    </div>
  );
}

// ── Per-step content ───────────────────────────────────────────────

interface ContentProps {
  step: number;
  onOpenStarters: () => void;
  onClose: () => void;
}

function Content({ step, onOpenStarters, onClose }: ContentProps) {
  if (step === 0) {
    return (
      <>
        <div className="tour-eyebrow">Welcome</div>
        <h2 className="tour-title">
          Your <span className="lp-accent">control tower</span>.
        </h2>
        <p className="tour-desc">
          Hangar pins every dev tool you ship with, vaults your tokens, and watches your whole
          stack from one runway. Everything lives in your browser — no Hangar account, no server
          ever sees your data.
        </p>
        <p className="tour-desc tour-desc-muted">
          Five quick steps to find your way around.
        </p>
      </>
    );
  }

  if (step === 1) {
    return (
      <>
        <div className="tour-eyebrow">Step 1 · Pin</div>
        <h2 className="tour-title">Build your stack.</h2>
        <p className="tour-desc">
          Browse <strong>29 built-in tools</strong> across 11 categories — or hit{" "}
          <strong>+ Add tool</strong> for your own. Click <strong>Pin</strong> on anything you
          actually use. Pinned tools live at the top of the dashboard for one-click access.
        </p>
        <p className="tour-desc tour-desc-muted">
          Tip: try a starter stack at the end of this tour to skip the pinning step.
        </p>
      </>
    );
  }

  if (step === 2) {
    return (
      <>
        <div className="tour-eyebrow">Step 2 · Vault</div>
        <h2 className="tour-title">Connect your tokens.</h2>
        <p className="tour-desc">
          Open <strong>Keys</strong> in the topbar (or any tool drawer&apos;s{" "}
          <strong>Add key</strong>). Drop in API tokens for the providers you use — they live in
          your browser&apos;s localStorage, never sent to a Hangar server.
        </p>
        <p className="tour-desc tour-desc-muted">
          Optionally lock the vault with a master passphrase. AES-GCM via the Web Crypto API,
          auto-locks after 15 minutes.
        </p>
      </>
    );
  }

  if (step === 3) {
    return (
      <>
        <div className="tour-eyebrow">Step 3 · Watch</div>
        <h2 className="tour-title">Today, in one place.</h2>
        <p className="tour-desc">
          Once tokens are connected, the <strong>Today</strong> panel surfaces what&apos;s broken
          across your stack — failed Vercel deploys, unresolved Sentry issues, urgent Linear
          tickets — ranked by severity.
        </p>
        <p className="tour-desc tour-desc-muted">
          The <strong>Stack health</strong> pill in the topbar tracks public status pages so you
          know if it&apos;s your problem or your provider&apos;s.
        </p>
      </>
    );
  }

  if (step === 4) {
    return (
      <>
        <div className="tour-eyebrow">Step 4 · AI</div>
        <h2 className="tour-title">Claude knows your stack.</h2>
        <p className="tour-desc">
          Drop an Anthropic key into the vault and click <strong>✦ Brief</strong> in the topbar
          for an instant synthesis of what&apos;s happening — with cross-tool correlations and a
          recommended action. Click <strong>✦</strong> on any Today incident to investigate it
          with full context.
        </p>
        <p className="tour-desc tour-desc-muted">
          Bonus: plug the bundled MCP server into Claude Desktop or Cursor so AI agents query
          your stack directly.
        </p>
      </>
    );
  }

  // step 5 — Get started
  return (
    <>
      <div className="tour-eyebrow">Ready?</div>
      <h2 className="tour-title">Pick your start.</h2>
      <p className="tour-desc">
        Adopt a curated starter stack to skip ahead, or start from scratch and pin tools as you
        find them.
      </p>
      <div className="tour-cta-stack">
        <button type="button" className="tour-btn tour-btn-primary tour-btn-lg" onClick={onOpenStarters}>
          Try a starter stack →
        </button>
        <button type="button" className="tour-btn tour-btn-ghost tour-btn-lg" onClick={onClose}>
          Start from scratch
        </button>
      </div>
      <p className="tour-desc tour-desc-muted">
        Press <kbd>?</kbd> any time for the keyboard cheat sheet.
      </p>
    </>
  );
}
