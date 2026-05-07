import { useEffect, useMemo, useState } from "react";
import type { ToolMetaMap } from "../hooks/useToolMeta";
import { Icon } from "../lib/icons";
import { buildShare, buildShareUrl } from "../lib/stackShare";
import type { Tool } from "../types";

interface Props {
  stackTools: Tool[];
  toolMeta: ToolMetaMap;
  onClose: () => void;
}

export function ShareModal({ stackTools, toolMeta, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [by, setBy] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const share = useMemo(
    () => buildShare({ stackTools, toolMeta, title, by }),
    [stackTools, toolMeta, title, by],
  );
  const url = useMemo(() => buildShareUrl(share), [share]);
  const plansCount = useMemo(
    () => share.tools.filter((t) => !!t.plan).length,
    [share],
  );

  const tweetText = title
    ? `${title} — my dev tool stack:`
    : "My dev tool stack:";
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(url)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Best-effort — most browsers allow clipboard.writeText, but some
      // contexts (insecure origins) don't. Fall back to selecting the URL.
      const el = document.getElementById("share-url-display");
      if (el instanceof HTMLElement) {
        const sel = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(el);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  };

  if (stackTools.length === 0) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="share-modal" onClick={(e) => e.stopPropagation()}>
          <header className="share-modal-head">
            <h2>Share your stack</h2>
            <button type="button" className="drawer-x" onClick={onClose}>
              <Icon.close />
            </button>
          </header>
          <div className="share-modal-body">
            <p className="share-blurb">
              Pin some tools first — once your stack has at least one tool, generate a
              public URL anyone can preview and adopt.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="share-modal" onClick={(e) => e.stopPropagation()}>
        <header className="share-modal-head">
          <h2>Share your stack</h2>
          <button type="button" className="drawer-x" onClick={onClose}>
            <Icon.close />
          </button>
        </header>
        <div className="share-modal-body">
          <p className="share-blurb">
            Generates a public URL anyone can open. Your tools and plans ride in the URL
            fragment — never sent to a server. Tokens stay in your vault.
          </p>

          <label className="share-field">
            <span className="share-field-label">Title <span className="muted">(optional)</span></span>
            <input
              type="text"
              className="keys-input"
              placeholder="My SaaS stack"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={60}
            />
          </label>

          <label className="share-field">
            <span className="share-field-label">Created by <span className="muted">(optional)</span></span>
            <input
              type="text"
              className="keys-input"
              placeholder="@yourhandle"
              value={by}
              onChange={(e) => setBy(e.target.value)}
              maxLength={40}
            />
          </label>

          <div className="share-field">
            <span className="share-field-label">Share URL</span>
            <div id="share-url-display" className="share-url-display">
              {url}
            </div>
          </div>

          <div className="share-actions">
            <button
              type="button"
              className="primary-btn small"
              onClick={handleCopy}
            >
              {copied ? <><Icon.check /> Copied</> : <>Copy URL</>}
            </button>
            <a
              className="ghost-btn small"
              href={tweetUrl}
              target="_blank"
              rel="noreferrer"
            >
              Tweet it ↗
            </a>
            <span className="share-summary muted">
              {stackTools.length} {stackTools.length === 1 ? "tool" : "tools"}
              {plansCount > 0 && ` · ${plansCount} plans tagged`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
