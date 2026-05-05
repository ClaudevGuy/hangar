import { useVercelData } from "../hooks/useVercelData";
import { Icon } from "../lib/icons";
import type { SecretsMap } from "../types";

interface Props {
  secrets: SecretsMap;
  onAddKey: () => void;
}

const STATE_LABELS: Record<string, string> = {
  READY: "ready",
  BUILDING: "building",
  QUEUED: "queued",
  ERROR: "error",
  CANCELED: "canceled",
  DELETED: "deleted",
  INITIALIZING: "init",
};

export function VercelInsights({ secrets, onAddKey }: Props) {
  const stored = secrets["vercel"] ?? [];
  const token = stored.find((k) => k.value)?.value || null;
  const { user, projects, deployments, loading, error } = useVercelData(token);

  if (!token) {
    return (
      <div className="insights-panel insights-empty">
        <div className="drawer-section-title">Your projects</div>
        <p className="muted">
          Add a Vercel access token to your vault to see your projects and recent deployments.
          Generate one at <a href="https://vercel.com/account/tokens" target="_blank" rel="noreferrer">vercel.com/account/tokens</a>.
        </p>
        <button type="button" className="primary-btn small" onClick={onAddKey}>
          <Icon.key /> Add Vercel token
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="insights-panel">
        <div className="drawer-section-title">Your projects</div>
        <ul className="gh-repos">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="gh-repo gh-repo-skeleton">
              <div className="skeleton-line w-60" />
              <div className="skeleton-line w-90" />
              <div className="skeleton-line w-40" />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (error) {
    return (
      <div className="insights-panel insights-error">
        <div className="drawer-section-title">Your projects</div>
        <p>
          Couldn't reach Vercel: <code>{error}</code>
        </p>
        <p className="muted">Check the token in your vault — it may be expired or scope-limited.</p>
      </div>
    );
  }

  return (
    <div className="insights-panel">
      {user && (
        <div className="gh-user">
          {user.avatar ? (
            <img
              className="gh-user-avatar"
              src={`https://vercel.com/api/www/avatar/${user.avatar}?s=64`}
              alt=""
              width={36}
              height={36}
            />
          ) : (
            <div className="gh-user-avatar linear-avatar-fallback" aria-hidden="true">
              {(user.username || user.email).slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="gh-user-meta">
            <div className="gh-user-name">{user.name || user.username}</div>
            <div className="gh-user-login">{user.email}</div>
          </div>
          <a
            className="ghost-btn small"
            href={`https://vercel.com/${user.username}`}
            target="_blank"
            rel="noreferrer"
          >
            Profile <Icon.arrow />
          </a>
        </div>
      )}

      {deployments.length > 0 && (
        <>
          <div className="drawer-section-title gh-repos-title">Recent deployments</div>
          <ul className="gh-repos">
            {deployments.slice(0, 4).map((d) => (
              <li key={d.uid} className="gh-repo">
                <a href={`https://${d.url}`} target="_blank" rel="noreferrer">
                  <div className="gh-repo-head">
                    <span className="gh-repo-name">{d.name}</span>
                    <span className={`vercel-state-pill state-${d.state.toLowerCase()}`}>
                      {STATE_LABELS[d.state] ?? d.state.toLowerCase()}
                    </span>
                    {d.target === "production" && (
                      <span className="gh-repo-private">prod</span>
                    )}
                  </div>
                  {d.meta?.githubCommitMessage && (
                    <div className="gh-repo-desc">{d.meta.githubCommitMessage}</div>
                  )}
                  <div className="gh-repo-meta">
                    {d.meta?.branch && <span>{d.meta.branch}</span>}
                    <span className="muted">{timeAgo(d.created)}</span>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="drawer-section-title gh-repos-title">Projects</div>
      {projects.length === 0 ? (
        <p className="muted">No projects on this token's scope.</p>
      ) : (
        <ul className="gh-repos">
          {projects.slice(0, 6).map((p) => {
            const prodUrl =
              p.targets?.production?.alias?.[0] ||
              p.targets?.production?.url ||
              p.link?.url ||
              `vercel.com/dashboard/${p.name}`;
            return (
              <li key={p.id} className="gh-repo">
                <a
                  href={prodUrl.startsWith("http") ? prodUrl : `https://${prodUrl}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <div className="gh-repo-head">
                    <span className="gh-repo-name">{p.name}</span>
                    {p.framework && <span className="gh-repo-private">{p.framework}</span>}
                  </div>
                  <div className="gh-repo-meta">
                    <span className="muted">updated {timeAgo(p.updatedAt)}</span>
                  </div>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function timeAgo(unixMs: number): string {
  const ms = Date.now() - unixMs;
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  const w = Math.floor(days / 7);
  if (w < 4) return `${w}w ago`;
  const mo = Math.floor(days / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}
