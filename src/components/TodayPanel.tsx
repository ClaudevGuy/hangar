import { TOOLS } from "../data/tools";
import { useGitHubData } from "../hooks/useGitHubData";
import { useLinearData } from "../hooks/useLinearData";
import { useVercelData } from "../hooks/useVercelData";
import { Icon } from "../lib/icons";
import type { SecretsMap, Tool } from "../types";
import { ToolLogo } from "./ToolLogo";

interface Props {
  secrets: SecretsMap;
  onOpenTool: (tool: Tool) => void;
}

// Lightweight, live snapshot from each connected provider. Renders only when
// there's at least one PAT in the vault for an integration; cards auto-cache
// via the per-token in-memory cache in each data hook.
export function TodayPanel({ secrets, onOpenTool }: Props) {
  const githubToken = secrets["github"]?.find((k) => k.value)?.value || null;
  const linearToken = secrets["linear"]?.find((k) => k.value)?.value || null;
  const vercelToken = secrets["vercel"]?.find((k) => k.value)?.value || null;

  // Bail if nothing is connected. Avoids an empty section taking up real estate.
  if (!githubToken && !linearToken && !vercelToken) return null;

  return (
    <div className="today-panel">
      <div className="strip-label">Today</div>
      <div className="today-grid">
        {githubToken && <GitHubCard token={githubToken} onOpenTool={onOpenTool} />}
        {vercelToken && <VercelCard token={vercelToken} onOpenTool={onOpenTool} />}
        {linearToken && <LinearCard token={linearToken} onOpenTool={onOpenTool} />}
      </div>
    </div>
  );
}

function findTool(id: string): Tool | undefined {
  return TOOLS.find((t) => t.id === id);
}

function timeAgoMs(ms: number): string {
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}
const since = (iso: string) => timeAgoMs(Date.now() - new Date(iso).getTime());
const sinceMs = (n: number) => timeAgoMs(Date.now() - n);

function GitHubCard({ token, onOpenTool }: { token: string; onOpenTool: (t: Tool) => void }) {
  const tool = findTool("github");
  const { user, repos, loading, error } = useGitHubData(token);

  const mostRecent = repos[0];

  return (
    <article
      className="today-card"
      onClick={() => tool && onOpenTool(tool)}
      role="button"
      tabIndex={0}
    >
      <header className="today-card-head">
        {tool && <ToolLogo tool={tool} size={28} />}
        <div className="today-card-name">GitHub</div>
        <span className="today-card-arrow"><Icon.arrow /></span>
      </header>
      {loading ? (
        <div className="today-card-body">
          <div className="skeleton-line w-60" />
          <div className="skeleton-line w-90" />
        </div>
      ) : error ? (
        <div className="today-card-body today-card-error">
          Token error · check vault
        </div>
      ) : (
        <div className="today-card-body">
          <div className="today-row">
            <span className="today-num">{user?.public_repos ?? "—"}</span>
            <span className="today-lbl">public repos</span>
          </div>
          {mostRecent && (
            <div className="today-row today-row-soft">
              <span>Last push:</span>
              <span className="today-mono">{mostRecent.full_name}</span>
              <span className="muted">{since(mostRecent.pushed_at)}</span>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function VercelCard({ token, onOpenTool }: { token: string; onOpenTool: (t: Tool) => void }) {
  const tool = findTool("vercel");
  const { user, projects, deployments, loading, error } = useVercelData(token);

  const latest = deployments[0];
  const latestState = latest?.state ?? "";
  const stateClass = latestState ? `state-${latestState.toLowerCase()}` : "";

  return (
    <article
      className="today-card"
      onClick={() => tool && onOpenTool(tool)}
      role="button"
      tabIndex={0}
    >
      <header className="today-card-head">
        {tool && <ToolLogo tool={tool} size={28} />}
        <div className="today-card-name">Vercel</div>
        <span className="today-card-arrow"><Icon.arrow /></span>
      </header>
      {loading ? (
        <div className="today-card-body">
          <div className="skeleton-line w-60" />
          <div className="skeleton-line w-90" />
        </div>
      ) : error ? (
        <div className="today-card-body today-card-error">
          Token error · check vault
        </div>
      ) : (
        <div className="today-card-body">
          <div className="today-row">
            <span className="today-num">{projects.length}</span>
            <span className="today-lbl">{projects.length === 1 ? "project" : "projects"}</span>
            {user && <span className="muted">· {user.username}</span>}
          </div>
          {latest && (
            <div className="today-row today-row-soft">
              <span>Last deploy:</span>
              <span className="today-mono">{latest.name}</span>
              <span className={`vercel-state-pill ${stateClass}`}>
                {latestState.toLowerCase()}
              </span>
              <span className="muted">{sinceMs(latest.created)}</span>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function LinearCard({ token, onOpenTool }: { token: string; onOpenTool: (t: Tool) => void }) {
  const tool = findTool("linear");
  const { viewer, issues, loading, error } = useLinearData(token);

  return (
    <article
      className="today-card"
      onClick={() => tool && onOpenTool(tool)}
      role="button"
      tabIndex={0}
    >
      <header className="today-card-head">
        {tool && <ToolLogo tool={tool} size={28} />}
        <div className="today-card-name">Linear</div>
        <span className="today-card-arrow"><Icon.arrow /></span>
      </header>
      {loading ? (
        <div className="today-card-body">
          <div className="skeleton-line w-60" />
          <div className="skeleton-line w-90" />
        </div>
      ) : error ? (
        <div className="today-card-body today-card-error">
          Token error · check vault
        </div>
      ) : (
        <div className="today-card-body">
          <div className="today-row">
            <span className="today-num">{issues.length}</span>
            <span className="today-lbl">assigned to you</span>
            {viewer && <span className="muted">· {viewer.organization.name}</span>}
          </div>
          {issues[0] && (
            <div className="today-row today-row-soft">
              <span>Top:</span>
              <span className="today-mono">{issues[0].identifier}</span>
              <span
                className="linear-state-pill"
                style={{ background: issues[0].state.color }}
              />
              <span className="muted">{since(issues[0].updatedAt)}</span>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
