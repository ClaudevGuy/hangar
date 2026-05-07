import { useCallback, useEffect, useRef, useState } from "react";
import type React from "react";
import { useGitHubData } from "../hooks/useGitHubData";
import { useLinearData } from "../hooks/useLinearData";
import { useSentryData } from "../hooks/useSentryData";
import { useVercelData } from "../hooks/useVercelData";
import type { ToolMetaMap } from "../hooks/useToolMeta";
import {
  buildBriefInput,
  generateBrief,
  parseBriefStructured,
  type BriefStatus,
  type BriefStructured,
} from "../lib/brief";
import { monthlyTotal } from "../lib/cost";
import { Icon } from "../lib/icons";
import { timeAgo } from "../lib/timeAgo";
import type { SecretsMap, Tool } from "../types";

interface Props {
  stackTools: Tool[];
  toolMeta: ToolMetaMap;
  secrets: SecretsMap;
  onAddAnthropicKey: () => void;
}

const STATUS_LABEL: Record<BriefStatus, string> = {
  green: "all clear",
  yellow: "watch",
  red: "needs attention",
};

const STATUS_SEV: Record<BriefStatus, "ok" | "warning" | "critical"> = {
  green: "ok",
  yellow: "warning",
  red: "critical",
};

// Render Claude's **bold** spans as <strong>. Plain text otherwise.
function renderWithBold(text: string): (string | React.ReactElement)[] {
  const parts: (string | React.ReactElement)[] = [];
  const re = /\*\*([^*]+)\*\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(<strong key={i++}>{match[1]}</strong>);
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function Brief({ stackTools, toolMeta, secrets, onAddAnthropicKey }: Props) {
  const anthropicKey = secrets["anthropic"]?.find((k) => k.value)?.value || null;
  const vercelToken = secrets["vercel"]?.find((k) => k.value)?.value || null;
  const sentryToken = secrets["sentry"]?.find((k) => k.value)?.value || null;
  const linearToken = secrets["linear"]?.find((k) => k.value)?.value || null;
  const githubToken = secrets["github"]?.find((k) => k.value)?.value || null;

  // Each hook short-circuits to IDLE when token is null and reuses the
  // per-token in-memory cache the Insights drawers populate, so we don't
  // spend new fetches when the user opens the brief popover.
  const vercel = useVercelData(vercelToken);
  const sentry = useSentryData(sentryToken);
  const linear = useLinearData(linearToken);
  const github = useGitHubData(githubToken);

  const [open, setOpen] = useState(false);
  const [structured, setStructured] = useState<BriefStructured | null>(null);
  const [rawFallback, setRawFallback] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const dataLoading =
    (!!vercelToken && vercel.loading) ||
    (!!sentryToken && sentry.loading) ||
    (!!linearToken && linear.loading) ||
    (!!githubToken && github.loading);

  // Outside-click + Escape close.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleGenerate = useCallback(async () => {
    if (!anthropicKey) return;
    setLoading(true);
    setError(null);
    try {
      const cost = monthlyTotal(stackTools, (id) => toolMeta[id]?.plan);
      const input = buildBriefInput({
        stackTools,
        monthlyCost: cost,
        vercel: { token: !!vercelToken, ...vercel },
        sentry: { token: !!sentryToken, ...sentry },
        linear: { token: !!linearToken, ...linear },
        github: { token: !!githubToken, user: github.user, error: github.error },
      });
      const text = await generateBrief(input, anthropicKey);
      const parsed = parseBriefStructured(text);
      setStructured(parsed);
      setRawFallback(parsed ? null : text);
      setGeneratedAt(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [
    anthropicKey, stackTools, toolMeta,
    vercelToken, sentryToken, linearToken, githubToken,
    vercel, sentry, linear, github.user, github.error,
  ]);

  return (
    <div className="brief-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`brief-trigger${open ? " is-open" : ""}`}
        onClick={() => setOpen((s) => !s)}
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Hangar Brief — AI-synthesized stack summary"
      >
        <span className="brief-trigger-spark">✦</span>
        <span>Brief</span>
      </button>

      {open && (
        <div className="brief-popover" role="dialog" aria-label="Hangar Brief">
          <div className="brief-pop-head">
            <div className="brief-label">
              <span className="brief-spark">✦</span>
              <span className="brief-label-text">Brief</span>
              {generatedAt && !loading && (
                <>
                  <span className="brief-sep">·</span>
                  <span className="brief-time">{timeAgo(generatedAt)}</span>
                </>
              )}
              {loading && (
                <>
                  <span className="brief-sep">·</span>
                  <span className="brief-time">synthesizing…</span>
                </>
              )}
            </div>
            {anthropicKey && (
              <button
                type="button"
                className="brief-refresh"
                onClick={handleGenerate}
                disabled={loading || dataLoading}
                title={dataLoading ? "Waiting for live data" : "Synthesize a fresh brief"}
              >
                {loading ? "…" : structured || rawFallback ? "Refresh" : "Generate"}
              </button>
            )}
          </div>

          <div className="brief-pop-body">
            {!anthropicKey ? (
              <>
                <p className="brief-cta">
                  Drop an Anthropic API key into your vault and Hangar synthesizes your
                  stack — deploys, errors, urgent tickets — into a structured briefing.
                </p>
                <button type="button" className="primary-btn small" onClick={onAddAnthropicKey}>
                  <Icon.key /> Add Anthropic key
                </button>
              </>
            ) : error ? (
              <div className="brief-error">
                Couldn&apos;t reach Anthropic: <code>{error}</code>
              </div>
            ) : structured ? (
              <>
                <div className={`brief-status sev-${STATUS_SEV[structured.status]}`}>
                  <span className="brief-status-dot" />
                  <span>{STATUS_LABEL[structured.status]}</span>
                </div>
                <p className="brief-headline">{renderWithBold(structured.headline)}</p>
                {structured.observations.length > 0 && (
                  <ul className="brief-observations">
                    {structured.observations.map((o, i) => (
                      <li key={i}>{renderWithBold(o)}</li>
                    ))}
                  </ul>
                )}
                {structured.recommendation && (
                  <div className="brief-rec">
                    <div className="brief-rec-label">Recommended action</div>
                    <p className="brief-rec-body">{renderWithBold(structured.recommendation)}</p>
                  </div>
                )}
              </>
            ) : rawFallback ? (
              // Claude returned non-JSON despite the prompt — render as prose
              // rather than failing visibly.
              <p className="brief-headline">{renderWithBold(rawFallback)}</p>
            ) : (
              <p className="brief-cta">
                Read your stack&apos;s story right now — a structured synthesis of recent
                deploys, unresolved errors, urgent tickets, and what to look at first.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
