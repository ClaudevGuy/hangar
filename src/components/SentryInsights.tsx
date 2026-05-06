import { useSentryData } from "../hooks/useSentryData";
import { Icon } from "../lib/icons";
import type { SecretsMap } from "../types";

interface Props {
  secrets: SecretsMap;
  onAddKey: () => void;
}

export function SentryInsights({ secrets, onAddKey }: Props) {
  const stored = secrets["sentry"] ?? [];
  const token = stored.find((k) => k.value)?.value || null;
  const { org, issues, loading, error } = useSentryData(token);

  if (!token) {
    return (
      <div className="insights-panel insights-empty">
        <div className="drawer-section-title">Recent issues</div>
        <p className="muted">
          Add a Sentry auth token to your vault to see unresolved issues from your projects.
          Generate one at{" "}
          <a
            href="https://sentry.io/settings/account/api/auth-tokens/"
            target="_blank"
            rel="noreferrer"
          >
            sentry.io/settings/account/api/auth-tokens/
          </a>{" "}
          with at least <code>org:read</code>, <code>project:read</code>,{" "}
          <code>event:read</code>.
        </p>
        <button type="button" className="primary-btn small" onClick={onAddKey}>
          <Icon.key /> Add Sentry token
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="insights-panel">
        <div className="drawer-section-title">Recent issues</div>
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
        <div className="drawer-section-title">Sentry</div>
        <p>
          Couldn't reach Sentry: <code>{error}</code>
        </p>
        <p className="muted">
          Check the token in your vault — it may be revoked or missing scopes.
        </p>
      </div>
    );
  }

  return (
    <div className="insights-panel">
      {org && (
        <div className="gh-user">
          <div className="gh-user-avatar linear-avatar-fallback" aria-hidden="true">
            {org.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="gh-user-meta">
            <div className="gh-user-name">{org.name}</div>
            <div className="gh-user-login">{org.slug}</div>
          </div>
          <a
            className="ghost-btn small"
            href={`https://sentry.io/organizations/${org.slug}/`}
            target="_blank"
            rel="noreferrer"
          >
            Workspace <Icon.arrow />
          </a>
        </div>
      )}

      <div className="drawer-section-title gh-repos-title">Unresolved · last 14 days</div>
      {issues.length === 0 ? (
        <p className="muted">No unresolved issues. All quiet.</p>
      ) : (
        <ul className="gh-repos">
          {issues.slice(0, 6).map((issue) => (
            <li key={issue.id} className="gh-repo">
              <a href={issue.permalink} target="_blank" rel="noreferrer">
                <div className="gh-repo-head">
                  <span className="gh-repo-name">{issue.shortId}</span>
                  <span className={`sentry-level-pill level-${issue.level}`}>
                    {issue.level}
                  </span>
                  <span className="gh-repo-private">{issue.project.slug}</span>
                </div>
                <div className="gh-repo-desc">{issue.title}</div>
                <div className="gh-repo-meta">
                  <span>{Number(issue.count).toLocaleString()} events</span>
                  <span>{issue.userCount.toLocaleString()} users</span>
                  <span className="muted">{timeAgo(issue.lastSeen)}</span>
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
