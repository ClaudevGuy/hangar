import { useResendData } from "../hooks/useResendData";
import type { SecretsMap } from "../types";
import { TokenPrompt } from "./TokenPrompt";

interface Props {
  secrets: SecretsMap;
  onAddKey: () => void;
}

export function ResendInsights({ secrets, onAddKey }: Props) {
  const stored = secrets["resend"] ?? [];
  const token = stored.find((k) => k.value)?.value || null;
  const { emails, domains, loading, error } = useResendData(token);

  if (!token) {
    return (
      <TokenPrompt
        toolId="resend"
        toolName="Resend"
        description="Add a Resend API key to your vault to see recent email sends and verified domains."
        tokenUrl="https://resend.com/api-keys"
        secrets={secrets}
        onAddKey={onAddKey}
      />
    );
  }

  if (loading) {
    return (
      <div className="insights-panel">
        <div className="drawer-section-title">Recent emails</div>
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
        <div className="drawer-section-title">Resend</div>
        <p>
          Couldn't reach Resend: <code>{error}</code>
        </p>
        <p className="muted">Check the API key in your vault — it may be revoked or scope-limited.</p>
      </div>
    );
  }

  return (
    <div className="insights-panel">
      <div className="drawer-section-title gh-repos-title">Recent emails</div>
      {emails.length === 0 ? (
        <p className="muted">No sent emails yet on this key.</p>
      ) : (
        <ul className="gh-repos">
          {emails.slice(0, 5).map((e) => (
            <li key={e.id} className="gh-repo">
              <a
                href={`https://resend.com/emails/${e.id}`}
                target="_blank"
                rel="noreferrer"
              >
                <div className="gh-repo-head">
                  <span className="gh-repo-name">{e.subject || "(no subject)"}</span>
                  {e.last_event && (
                    <span className="gh-repo-private">{e.last_event}</span>
                  )}
                </div>
                <div className="gh-repo-desc">to {e.to.join(", ")}</div>
                <div className="gh-repo-meta">
                  <span>from {e.from}</span>
                  <span className="muted">{timeAgo(new Date(e.created_at).getTime())}</span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}

      <div className="drawer-section-title gh-repos-title">Domains</div>
      {domains.length === 0 ? (
        <p className="muted">No domains configured.</p>
      ) : (
        <ul className="gh-repos">
          {domains.slice(0, 6).map((d) => (
            <li key={d.id} className="gh-repo">
              <a
                href={`https://resend.com/domains/${d.id}`}
                target="_blank"
                rel="noreferrer"
              >
                <div className="gh-repo-head">
                  <span className="gh-repo-name">{d.name}</span>
                  <span className="gh-repo-private">{d.status}</span>
                </div>
                {d.region && <div className="gh-repo-meta"><span>{d.region}</span></div>}
              </a>
            </li>
          ))}
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
