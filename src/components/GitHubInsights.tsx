import { useGitHubData } from "../hooks/useGitHubData";
import { Icon } from "../lib/icons";
import type { SecretsMap } from "../types";

interface Props {
  secrets: SecretsMap;
  onOpenKeys: () => void;
}

export function GitHubInsights({ secrets, onOpenKeys }: Props) {
  const stored = secrets["github"] ?? [];
  // Use the first non-empty value. The user can keep multiple keys but we
  // don't try to guess which is "primary" — they can reorder by saving fresh.
  const token = stored.find((k) => k.value)?.value || null;

  const { user, repos, loading, error } = useGitHubData(token);

  if (!token) {
    return (
      <div className="insights-panel insights-empty">
        <div className="drawer-section-title">Your repos</div>
        <p className="muted">
          Add a GitHub Personal Access Token to your vault to see your latest repos here.
          A token with <code>repo</code> read scope is enough.
        </p>
        <button type="button" className="primary-btn small" onClick={onOpenKeys}>
          <Icon.key /> Open keys vault
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="insights-panel">
        <div className="drawer-section-title">Your repos</div>
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
        <div className="drawer-section-title">Your repos</div>
        <p>
          Couldn't reach GitHub: <code>{error}</code>
        </p>
        <p className="muted">Check the token in your vault — it may be expired or missing scope.</p>
      </div>
    );
  }

  return (
    <div className="insights-panel">
      {user && (
        <div className="gh-user">
          <img className="gh-user-avatar" src={user.avatar_url} alt="" width={36} height={36} />
          <div className="gh-user-meta">
            <div className="gh-user-name">{user.name || user.login}</div>
            <div className="gh-user-login">
              @{user.login} · {user.public_repos} public · {user.followers} followers
            </div>
          </div>
          <a
            className="ghost-btn small"
            href={user.html_url}
            target="_blank"
            rel="noreferrer"
          >
            Profile <Icon.arrow />
          </a>
        </div>
      )}

      <div className="drawer-section-title gh-repos-title">Recent repos</div>
      {repos.length === 0 ? (
        <p className="muted">No repos visible to this token.</p>
      ) : (
        <ul className="gh-repos">
          {repos.slice(0, 6).map((r) => (
            <li key={r.id} className="gh-repo">
              <a href={r.html_url} target="_blank" rel="noreferrer">
                <div className="gh-repo-head">
                  <span className="gh-repo-name">{r.full_name}</span>
                  {r.private && <span className="gh-repo-private">private</span>}
                </div>
                {r.description && <div className="gh-repo-desc">{r.description}</div>}
                <div className="gh-repo-meta">
                  {r.language && <span>{r.language}</span>}
                  <span>★ {r.stargazers_count}</span>
                  {r.open_issues_count > 0 && <span>{r.open_issues_count} open</span>}
                  <span className="muted">{timeAgo(r.pushed_at)}</span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
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
