import { useGitHubData } from "../hooks/useGitHubData";
import { useLinearData } from "../hooks/useLinearData";
import { useVercelData } from "../hooks/useVercelData";
import { Icon } from "../lib/icons";
import type { SecretsMap, Tool } from "../types";
import { ToolLogo } from "./ToolLogo";

interface Props {
  tool: Tool;
  secrets: SecretsMap;
  draggingId: string | null;
  dragOverId: string | null;
  onLaunch: (tool: Tool) => void;
  onDragStart: (toolId: string, e: React.DragEvent<HTMLButtonElement>) => void;
  onDragOver: (toolId: string, e: React.DragEvent<HTMLButtonElement>) => void;
  onDragLeave: (toolId: string) => void;
  onDrop: (toolId: string, e: React.DragEvent<HTMLButtonElement>) => void;
  onDragEnd: () => void;
}

export function LauncherTile({
  tool, secrets, draggingId, dragOverId,
  onLaunch, onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd,
}: Props) {
  const token = secrets[tool.id]?.find((k) => k.value)?.value || null;
  const isConnected = !!token;
  const summary = useTileSummary(tool.id, token);

  return (
    <button
      type="button"
      className={`launcher-tile ${draggingId === tool.id ? "is-drag-source" : ""} ${dragOverId === tool.id && draggingId !== tool.id ? "is-drop-target" : ""}`}
      onClick={() => onLaunch(tool)}
      title={`Open ${tool.name} dashboard`}
      draggable
      onDragStart={(e) => onDragStart(tool.id, e)}
      onDragOver={(e) => onDragOver(tool.id, e)}
      onDragLeave={() => onDragLeave(tool.id)}
      onDrop={(e) => onDrop(tool.id, e)}
      onDragEnd={onDragEnd}
    >
      <ToolLogo tool={tool} size={32} />
      <div className="launcher-tile-meta">
        <div className="launcher-tile-name">
          {tool.name}
          {isConnected && (
            <span
              className="launcher-status-dot"
              title="Connected — key in vault"
              aria-label="Connected"
            />
          )}
        </div>
        {summary ?? <div className="launcher-tile-cat">{tool.category}</div>}
      </div>
      <Icon.arrow />
    </button>
  );
}

// Renders a single live-summary line under the tool name. Returns null when
// there's no integration data (caller falls back to category).
function useTileSummary(toolId: string, token: string | null): React.ReactNode {
  // We always call the hooks — they no-op when token is null. Keeps hook order stable.
  const gh = useGitHubData(toolId === "github" ? token : null);
  const ve = useVercelData(toolId === "vercel" ? token : null);
  const li = useLinearData(toolId === "linear" ? token : null);

  if (!token) return null;

  if (toolId === "github") {
    if (gh.loading) return <div className="launcher-tile-summary loading">syncing…</div>;
    if (gh.error) return <div className="launcher-tile-summary error">token error</div>;
    const last = gh.repos[0];
    const repoCount = gh.user?.public_repos ?? gh.repos.length;
    return (
      <div className="launcher-tile-summary">
        {repoCount} {repoCount === 1 ? "repo" : "repos"}
        {last && <span className="muted"> · {sinceIso(last.pushed_at)}</span>}
      </div>
    );
  }

  if (toolId === "vercel") {
    if (ve.loading) return <div className="launcher-tile-summary loading">syncing…</div>;
    if (ve.error) return <div className="launcher-tile-summary error">token error</div>;
    const dep = ve.deployments[0];
    return (
      <div className="launcher-tile-summary">
        {ve.projects.length} {ve.projects.length === 1 ? "project" : "projects"}
        {dep && (
          <>
            <span className="muted"> · </span>
            <span className={`vercel-state-pill state-${dep.state.toLowerCase()}`}>
              {dep.state.toLowerCase()}
            </span>
            <span className="muted"> {sinceMs(dep.created)}</span>
          </>
        )}
      </div>
    );
  }

  if (toolId === "linear") {
    if (li.loading) return <div className="launcher-tile-summary loading">syncing…</div>;
    if (li.error) return <div className="launcher-tile-summary error">token error</div>;
    const top = li.issues[0];
    return (
      <div className="launcher-tile-summary">
        {li.issues.length} {li.issues.length === 1 ? "issue" : "issues"}
        {top && <span className="muted"> · {sinceIso(top.updatedAt)}</span>}
      </div>
    );
  }

  // Connected but no rich integration yet — show a subtle confirmation.
  return <div className="launcher-tile-summary muted">connected · key in vault</div>;
}

function sinceIso(iso: string): string {
  return sinceMs(new Date(iso).getTime());
}

function sinceMs(ms: number): string {
  const d = Date.now() - ms;
  const m = Math.floor(d / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  const w = Math.floor(days / 7);
  return `${w}w ago`;
}
