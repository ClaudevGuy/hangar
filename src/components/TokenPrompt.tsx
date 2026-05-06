import { Icon } from "../lib/icons";
import type { SecretsMap } from "../types";

interface Props {
  toolId: string;
  toolName: string;
  description: string;
  tokenUrl: string;
  secrets: SecretsMap;
  onAddKey: () => void;
}

// Empty-state token prompt for tools without a full live-data integration
// yet. Mirrors the visual pattern of the no-token branch in VercelInsights /
// LinearInsights so future real integrations can drop in here without
// rewriting the section. Renders nothing once a key is present — keeps the
// drawer honest (we don't pretend to show data we don't fetch).
export function TokenPrompt({ toolId, toolName, description, tokenUrl, secrets, onAddKey }: Props) {
  const hasToken = (secrets[toolId] ?? []).some((k) => k.value);
  if (hasToken) return null;

  const urlText = tokenUrl.replace(/^https?:\/\//, "");

  return (
    <div className="insights-panel insights-empty">
      <div className="drawer-section-title">Live integration</div>
      <p className="muted">
        {description} Generate one at{" "}
        <a href={tokenUrl} target="_blank" rel="noreferrer">
          {urlText}
        </a>
        .
      </p>
      <button type="button" className="primary-btn small" onClick={onAddKey}>
        <Icon.key /> Add {toolName} token
      </button>
    </div>
  );
}
