import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { ToolLogo } from "../../components/ToolLogo";
import {
  adoptShare,
  buildLocalShareUrl,
  decodeShare,
  isLocalHost,
  resolveShareTools,
  type AdoptResult,
  type ShareV1,
} from "../../lib/stackShare";

// Standalone /share preview screen. Decodes the share data from the URL hash,
// shows the contents, and offers an "Adopt" CTA when running on localhost
// (or instructions to open the URL in a local Hangar otherwise).
export function SharePreview() {
  const [share, setShare] = useState<ShareV1 | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adopted, setAdopted] = useState<AdoptResult | null>(null);
  const [copiedLocalUrl, setCopiedLocalUrl] = useState(false);

  useEffect(() => {
    const stored = (localStorage.getItem("hangar-landing-theme") as "dark" | "light") ?? "dark";
    const prev = document.body.dataset.theme;
    document.body.dataset.theme = stored;
    return () => {
      document.body.dataset.theme = prev || "dark";
    };
  }, []);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    const data = params.get("data");
    if (!data) {
      setError("No share data in this URL.");
      return;
    }
    const decoded = decodeShare(data);
    if (!decoded) {
      setError("This share link is invalid or corrupted.");
      return;
    }
    setShare(decoded);
  }, []);

  const local = isLocalHost();
  const resolved = useMemo(
    () => (share ? resolveShareTools(share) : []),
    [share],
  );
  const knownTools = resolved.filter((r) => r.inCatalog);
  const unknownCount = resolved.length - knownTools.length;
  const planCount = resolved.filter((r) => !!r.plan).length;
  const localUrl = useMemo(
    () => (share ? buildLocalShareUrl(share) : null),
    [share],
  );

  const handleAdopt = () => {
    if (!share) return;
    const result = adoptShare(share);
    setAdopted(result);
    window.setTimeout(() => {
      window.location.href = "/app";
    }, 1500);
  };

  const handleCopyLocalUrl = async () => {
    if (!localUrl) return;
    try {
      await navigator.clipboard.writeText(localUrl);
      setCopiedLocalUrl(true);
      window.setTimeout(() => setCopiedLocalUrl(false), 2000);
    } catch {
      // ignore
    }
  };

  if (error) {
    return (
      <div className="share-preview">
        <div className="share-preview-bg" />
        <div className="share-preview-glow" />
        <div className="share-preview-inner share-preview-error">
          <div className="share-preview-eyebrow">Stack share</div>
          <h1 className="share-preview-title">Couldn&apos;t open this share.</h1>
          <p className="share-preview-desc">{error}</p>
          <a className="lp-btn lp-btn-primary lp-btn-lg" href="/">Back to Hangar</a>
        </div>
      </div>
    );
  }

  if (!share) {
    return (
      <div className="share-preview">
        <div className="share-preview-bg" />
        <div className="share-preview-glow" />
        <div className="share-preview-inner">
          <div className="share-preview-eyebrow">Stack share</div>
          <p className="share-preview-desc">Loading…</p>
        </div>
      </div>
    );
  }

  if (adopted) {
    return (
      <div className="share-preview">
        <div className="share-preview-bg" />
        <div className="share-preview-glow" />
        <div className="share-preview-inner">
          <div className="share-preview-eyebrow share-preview-success">Adopted</div>
          <h1 className="share-preview-title">
            Added <span className="lp-accent">{adopted.added}</span> {adopted.added === 1 ? "tool" : "tools"} to your stack.
          </h1>
          <p className="share-preview-desc">
            {adopted.alreadyHad > 0 && (
              <>{adopted.alreadyHad} {adopted.alreadyHad === 1 ? "was" : "were"} already there. </>
            )}
            {adopted.unknown > 0 && (
              <>{adopted.unknown} skipped (not in your catalog). </>
            )}
            Redirecting to your Hangar…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="share-preview">
      <div className="share-preview-bg" />
      <div className="share-preview-glow" />
      <div className="share-preview-inner">
        <div className="share-preview-eyebrow">A shared Hangar stack</div>
        <h1 className="share-preview-title">
          {share.title || <span className="lp-soft">Untitled stack</span>}
        </h1>
        {share.by && <div className="share-preview-by">by {share.by}</div>}

        <div className="share-preview-stats">
          <span><strong>{knownTools.length}</strong> {knownTools.length === 1 ? "tool" : "tools"}</span>
          {planCount > 0 && (
            <span><strong>{planCount}</strong> {planCount === 1 ? "plan" : "plans"} tagged</span>
          )}
          {unknownCount > 0 && (
            <span className="lp-soft">{unknownCount} not in your catalog</span>
          )}
        </div>

        {knownTools.length > 0 && (
          <ul className="share-preview-tools">
            {knownTools.map((t) => {
              if (!t.catalog) return null;
              const style = { "--brand": t.catalog.color, "--brand-bg": t.catalog.bg } as CSSProperties;
              return (
                <li key={t.id} className="share-preview-tool" style={style}>
                  <ToolLogo tool={t.catalog} size={32} />
                  <div className="share-preview-tool-meta">
                    <div className="share-preview-tool-name">{t.catalog.name}</div>
                    <div className="share-preview-tool-cat">
                      {t.catalog.category}
                      {t.plan && <span className="share-preview-tool-plan"> · {t.plan}</span>}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="share-preview-cta">
          {local ? (
            <button type="button" className="lp-btn lp-btn-primary lp-btn-lg" onClick={handleAdopt}>
              Adopt to my Hangar →
            </button>
          ) : (
            <div className="share-preview-localhost">
              <p className="share-preview-localhost-blurb">
                To adopt these tools, open this share in your local Hangar:
              </p>
              <div className="share-preview-localhost-url">
                <code>{localUrl}</code>
              </div>
              <div className="share-preview-localhost-actions">
                <button
                  type="button"
                  className="lp-btn lp-btn-primary"
                  onClick={handleCopyLocalUrl}
                >
                  {copiedLocalUrl ? "Copied" : "Copy local URL"}
                </button>
                <a className="lp-btn" href="/#install">
                  Don&apos;t have Hangar? Install it
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
