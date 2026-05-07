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

  // No Anthropic key in the vault → show a connect prompt instead.
  if (!anthropicKey) {
    return (
      <section className="brief-panel brief-empty">
        <div className="brief-head">
          <div className="strip-label">Brief</div>
          <div className="brief-head-meta">connect anthropic to enable</div>
        </div>
        <p className="muted brief-empty-blurb">
          Drop an Anthropic API key into your vault and Hangar will synthesize
          your stack state into a 4-sentence morning briefing — cross-tool
          correlations, anomalies, and a recommended action.
        </p>
        <button type="button" className="primary-btn small" onClick={onAddAnthropicKey}>
          <Icon.key /> Add Anthropic key
        </button>
      </section>
    );
  }

  return (
    <section className="brief-panel">
      <div className="brief-head">
        <div className="strip-label">Brief</div>
        <div className="brief-head-actions">
          {generatedAt && !loading && (
            <span className="brief-head-meta">generated {timeAgo(generatedAt)}</span>
          )}
          <button
            type="button"
            className="ghost-btn small"
            onClick={handleGenerate}
            disabled={loading || dataLoading}
            title={dataLoading ? "Waiting for live data to load" : "Synthesize a brief"}
          >
            {loading ? "Synthesizing…" : brief ? "Refresh" : "Generate brief"}
          </button>
        </div>
      </div>

      {error && (
        <div className="brief-error">
          Couldn't reach Anthropic: <code>{error}</code>
        </div>
      )}

      {brief ? (
        <p className="brief-body">{renderBrief(brief)}</p>
      ) : (
        !error && (
          <p className="muted brief-blurb">
            Click <strong>Generate brief</strong> to read your stack&apos;s current state — a
            short narrative built from your live Vercel deploys, Sentry issues, Linear
            queue, and stack costs. Costs about a fraction of a cent per run on
            <code> claude-sonnet-4-5</code>.
          </p>
        )
      )}
    </section>
  );
}
