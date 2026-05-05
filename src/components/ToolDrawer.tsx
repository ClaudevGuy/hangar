import type { CSSProperties } from "react";
import { ACTIVITY, TOOLS } from "../data/tools";
import { Icon } from "../lib/icons";
import type { SecretsMap, Tool } from "../types";
import { GitHubInsights } from "./GitHubInsights";
import { LinearInsights } from "./LinearInsights";
import { VercelInsights } from "./VercelInsights";
import { ToolLogo } from "./ToolLogo";

interface Props {
  tool: Tool | null;
  pinned: boolean;
  secrets: SecretsMap;
  onClose: () => void;
  onPin: (tool: Tool) => void;
  onLaunch: (tool: Tool) => void;
  onOpenKeys: () => void;
  onAddKeyForTool: (tool: Tool) => void;
  onEditCustomTool: (tool: Tool) => void;
  onRemoveCustomTool: (tool: Tool) => void;
}

export function ToolDrawer({
  tool, pinned, secrets, onClose, onPin, onLaunch, onOpenKeys, onAddKeyForTool,
  onEditCustomTool, onRemoveCustomTool,
}: Props) {
  if (!tool) return null;

  const recent = ACTIVITY.filter((a) => a.tool === tool.id);
  const pairs = TOOLS.filter((t) => t.id !== tool.id).slice(0, 6);

  // Per-tool brand color hooks for `.drawer-cat` accent.
  const drawerStyle = {
    "--brand": tool.color,
    "--brand-bg": tool.bg,
  } as CSSProperties;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()} style={drawerStyle}>
        <button type="button" className="drawer-x" onClick={onClose}>
          <Icon.close />
        </button>

        <div className="drawer-hero">
          <ToolLogo tool={tool} size={64} />
          <div>
            <div className="drawer-cat">{tool.category}</div>
            <h2 className="drawer-title">{tool.name}</h2>
            <p className="drawer-tag">{tool.tagline}</p>
          </div>
        </div>

        <div className="drawer-cta">
          <button type="button" className="primary-btn" onClick={() => onLaunch(tool)}>
            Open {tool.name} <Icon.arrow />
          </button>
          <button
            type="button"
            className={`secondary-btn ${pinned ? "on" : ""}`}
            onClick={() => onPin(tool)}
          >
            {pinned ? (
              <>
                <Icon.check /> Pinned to stack
              </>
            ) : (
              <>
                <Icon.plus /> Pin to stack
              </>
            )}
          </button>
          <button
            type="button"
            className="secondary-btn"
            onClick={() => onAddKeyForTool(tool)}
            title={`Manage ${tool.name} API keys`}
          >
            <Icon.key />
            {(secrets[tool.id]?.length ?? 0) > 0
              ? `${secrets[tool.id]!.length} ${secrets[tool.id]!.length === 1 ? "key" : "keys"}`
              : "Add key"}
          </button>
          {tool.custom && (
            <>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => onEditCustomTool(tool)}
                title="Edit this custom tool"
              >
                Edit
              </button>
              <button
                type="button"
                className="secondary-btn drawer-danger"
                onClick={() => {
                  if (window.confirm(`Remove "${tool.name}" from your custom tools?`)) {
                    onRemoveCustomTool(tool);
                  }
                }}
                title="Remove this custom tool"
              >
                <Icon.trash />
              </button>
            </>
          )}
        </div>

        <dl className="drawer-meta">
          <div>
            <dt>Account</dt>
            <dd>
              <a href={tool.accountUrl} target="_blank" rel="noreferrer">
                {tool.accountUrl.replace("https://", "")}
              </a>
            </dd>
          </div>
          <div>
            <dt>Docs</dt>
            <dd>
              <a href={tool.docs} target="_blank" rel="noreferrer">
                {tool.docs.replace("https://", "")}
              </a>
            </dd>
          </div>
          <div>
            <dt>Pricing</dt>
            <dd>{tool.pricing}</dd>
          </div>
          {tool.plan && (
            <div>
              <dt>Your plan</dt>
              <dd className="plan-pill">{tool.plan}</dd>
            </div>
          )}
          {tool.status === "live" && (
            <div>
              <dt>Status</dt>
              <dd>
                <span className="status-dot live" /> Live
              </dd>
            </div>
          )}
        </dl>

        {tool.id === "github" && (
          <div className="drawer-section">
            <GitHubInsights secrets={secrets} onOpenKeys={onOpenKeys} />
          </div>
        )}

        {tool.id === "linear" && (
          <div className="drawer-section">
            <LinearInsights secrets={secrets} onAddKey={() => onAddKeyForTool(tool)} />
          </div>
        )}

        {tool.id === "vercel" && (
          <div className="drawer-section">
            <VercelInsights secrets={secrets} onAddKey={() => onAddKeyForTool(tool)} />
          </div>
        )}

        <div className="drawer-section">
          <div className="drawer-section-title">Recent</div>
          <ul className="drawer-activity">
            {recent.map((a, i) => (
              <li key={i}>
                <span className="act-line">{a.text}</span>
                <span className="act-time">{a.time}</span>
              </li>
            ))}
            {recent.length === 0 && (
              <li className="muted">
                No activity surfaced yet. Hangar will pick up events once connected.
              </li>
            )}
          </ul>
        </div>

        <div className="drawer-section">
          <div className="drawer-section-title">Pairs well with</div>
          <div className="pairs">
            {pairs.map((t) => (
              <div key={t.id} className="pair">
                <ToolLogo tool={t} size={22} />
                <span>{t.name}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
