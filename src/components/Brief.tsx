import { useCallback, useState } from "react";
import { useGitHubData } from "../hooks/useGitHubData";
import { useLinearData } from "../hooks/useLinearData";
import { useSentryData } from "../hooks/useSentryData";
import { useVercelData } from "../hooks/useVercelData";
import type { ToolMetaMap } from "../hooks/useToolMeta";
import { buildBriefInput, generateBrief } from "../lib/brief";
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

// Formats the brief markdown — Claude returns plain prose with **bold** spans.
// We render **...** as <strong>; everything else is text. No need to pull in a
// full markdown lib for this.
function renderBrief(text: string): (string | React.ReactElement)[] {
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

  // Each hook short-circuits to IDLE when token is null — calling them
  // unconditionally is safe and keeps the per-token cache warm with the
  // existing insights drawers.
  const vercel = useVercelData(vercelToken);
  const sentry = useSentryData(sentryToken);
  const linear = useLinearData(linearToken);
  const github = useGitHubData(githubToken);

  const [brief, setBrief] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dataLoading =
    (!!vercelToken && vercel.loading) ||
    (!!sentryToken && sentry.loading) ||
    (!!linearToken && linear.loading) ||
    (!!githubToken && github.loading);

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
      setBrief(text);
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

  // No Anthropic key in the vault → small subtle prompt; doesn't dominate
  // the dashboard for users who don't want AI features.
  if (!anthropicKey) {
    return (
      <section className="brief-panel brief-empty">
        <div className="brief-bar" />
        <div className="brief-body-wrap">
          <div className="brief-head">
            <div className="brief-label">
              <span className="brief-spark">✦</span>
              <span className="brief-label-text">Brief</span>
              <span className="brief-sep">·</span>
              <span className="brief-time">connect anthropic to enable</span>
            </div>
          </div>
          <p className="brief-cta">
            Drop an Anthropic API key into your vault and Hangar synthesizes your stack
            state — deploys, errors, urgent tickets — into a 4-sentence briefing.
          </p>
          <button type="button" className="primary-btn small" onClick={onAddAnthropicKey}>
            <Icon.key /> Add Anthropic key
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className={`brief-panel${brief ? " brief-has-content" : ""}`}>
      <div className="brief-bar" />
      <div className="brief-body-wrap">
        <div className="brief-head">
          <div className="brief-label">
            <span className="brief-spark">✦</span>
            <span className="brief-label-text">Brief</span>
            {generatedAt && !loading && (
              <>
                <span className="brief-sep">·</span>
                <span className="brief-time">generated {timeAgo(generatedAt)}</span>
              </>
            )}
            {loading && (
              <>
                <span className="brief-sep">·</span>
                <span className="brief-time">synthesizing…</span>
              </>
            )}
          </div>
          <button
            type="button"
            className="brief-refresh"
            onClick={handleGenerate}
            disabled={loading || dataLoading}
            title={
              dataLoading
                ? "Waiting for live data to load"
                : brief
                  ? "Refresh — re-synthesize from the latest data"
                  : "Generate brief"
            }
          >
            {loading ? "…" : brief ? "Refresh" : "Generate brief"}
          </button>
        </div>

        {error && (
          <div className="brief-error">
            Couldn&apos;t reach Anthropic: <code>{error}</code>
          </div>
        )}

        {brief ? (
          <p className="brief-body">{renderBrief(brief)}</p>
        ) : (
          !error && (
            <p className="brief-cta">
              Read your stack&apos;s story right now — a 4-sentence synthesis of recent deploys,
              unresolved errors, urgent tickets, and what to look at first.
            </p>
          )
        )}
      </div>
    </section>
  );
}
