import { useLinearData } from "../hooks/useLinearData";
import { Icon } from "../lib/icons";
import type { SecretsMap } from "../types";

interface Props {
  secrets: SecretsMap;
  onAddKey: () => void;
}

const PRIORITY_LABELS: Record<number, string> = {
  0: "—",
  1: "Urgent",
  2: "High",
  3: "Med",
  4: "Low",
};

export function LinearInsights({ secrets, onAddKey }: Props) {
  const stored = secrets["linear"] ?? [];
  const token = stored.find((k) => k.value)?.value || null;
  const { viewer, issues, loading, error } = useLinearData(token);

  if (!token) {
    return (
      <div className="insights-panel insights-empty">
        <div className="drawer-section-title">Your assigned issues</div>
        <p className="muted">
          Add a Linear personal API key to your vault to see issues assigned to you. Generate one
          at <a href="https://linear.app/settings/api" target="_blank" rel="noreferrer">linear.app/settings/api</a>.
        </p>
        <button type="button" className="primary-btn small" onClick={onAddKey}>
          <Icon.key /> Add Linear key
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="insights-panel">
        <div className="drawer-section-title">Your assigned issues</div>
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
        <div className="drawer-section-title">Your assigned issues</div>
        <p>
          Couldn't reach Linear: <code>{error}</code>
        </p>
        <p className="muted">Check the API key in your vault — it may be expired.</p>
      </div>
    );
  }

  return (
    <div className="insights-panel">
      {viewer && (
        <div className="gh-user">
          {viewer.avatarUrl ? (
            <img className="gh-user-avatar" src={viewer.avatarUrl} alt="" width={36} height={36} />
          ) : (
            <div
              className="gh-user-avatar linear-avatar-fallback"
              aria-hidden="true"
            >
              {viewer.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="gh-user-meta">
            <div className="gh-user-name">{viewer.name}</div>
            <div className="gh-user-login">
              {viewer.email} · {viewer.organization.name}
            </div>
          </div>
          <a
            className="ghost-btn small"
            href={`https://linear.app/${viewer.organization.urlKey}`}
            target="_blank"
            rel="noreferrer"
          >
            Workspace <Icon.arrow />
          </a>
        </div>
      )}

      <div className="drawer-section-title gh-repos-title">Recently updated · assigned to you</div>
      {issues.length === 0 ? (
        <p className="muted">No issues assigned to you. Inbox zero, congrats.</p>
      ) : (
        <ul className="gh-repos">
          {issues.map((issue) => (
            <li key={issue.id} className="gh-repo">
              <a href={issue.url} target="_blank" rel="noreferrer">
                <div className="gh-repo-head">
                  <span className="gh-repo-name">{issue.identifier}</span>
                  <span
                    className="linear-state-pill"
                    style={{ background: issue.state.color }}
                    title={issue.state.name}
                  />
                  <span className="gh-repo-private">{issue.state.name}</span>
                </div>
                <div className="gh-repo-desc">{issue.title}</div>
                <div className="gh-repo-meta">
                  <span>{issue.team.key}</span>
                  <span>{PRIORITY_LABELS[issue.priority] ?? "—"}</span>
                  <span className="muted">{timeAgo(issue.updatedAt)}</span>
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
