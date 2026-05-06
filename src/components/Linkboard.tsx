import { useEffect, useRef, useState } from "react";
import { Icon } from "../lib/icons";
import { suggest } from "../lib/linkInfer";
import type { LinkItem, Tool } from "../types";
import { ToolLogo } from "./ToolLogo";

interface Props {
  links: LinkItem[];
  customTools: Tool[];
  builtInTools: Tool[];
  onAdd: (entry: Omit<LinkItem, "id" | "addedAt">) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

// "Working on" — pinned items across tools. Lives at the top of the sidebar
// so it's visible while you switch between tools.
export function Linkboard({ links, customTools, builtInTools, onAdd, onRemove, onClear }: Props) {
  const [adding, setAdding] = useState(false);
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  // Live preview as the user types — match the URL against built-in + custom
  // tools and derive a sensible default label.
  const preview = url ? suggest(url, customTools) : null;
  const effectiveLabel = label.trim() || preview?.label || "";

  const submit = () => {
    if (!url.trim()) return;
    try {
      // Validate URL.
      const u = new URL(url);
      if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("bad protocol");
    } catch {
      setError("Needs a full http(s) URL");
      return;
    }
    onAdd({
      url: url.trim(),
      label: effectiveLabel || url,
      toolId: preview?.tool?.id ?? null,
    });
    setUrl("");
    setLabel("");
    setError(null);
    setAdding(false);
  };

  return (
    <div className="side-section">
      <div className="side-label">
        Working on{" "}
        <span className="lbl-count">{links.length}</span>
        {links.length > 0 && (
          <button
            type="button"
            className="link-clear"
            onClick={() => {
              if (window.confirm("Clear all linkboard items?")) onClear();
            }}
            title="Clear all"
          >
            clear
          </button>
        )}
      </div>

      {links.length > 0 && (
        <ul className="link-list">
          {links.map((link) => {
            const tool =
              [...builtInTools, ...customTools].find((t) => t.id === link.toolId) ?? null;
            return (
              <li key={link.id} className="link-item">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="link-main"
                  title={link.url}
                >
                  {tool ? (
                    <ToolLogo tool={tool} size={22} />
                  ) : (
                    <span className="link-fallback" aria-hidden="true">
                      ◇
                    </span>
                  )}
                  <span className="link-label">{link.label}</span>
                </a>
                <button
                  type="button"
                  className="stack-x"
                  onClick={() => onRemove(link.id)}
                  title="Remove"
                >
                  <Icon.close />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {adding ? (
        <div className="link-add">
          <input
            ref={inputRef}
            type="url"
            className="keys-input"
            placeholder="Paste URL — github.com/.../pull/42, linear.app/.../ABC-123, etc."
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
              if (e.key === "Escape") {
                setAdding(false);
                setUrl("");
                setLabel("");
              }
            }}
          />
          {url && preview && (
            <div className="link-preview">
              {preview.tool ? (
                <>
                  <ToolLogo tool={preview.tool} size={18} />
                  <span className="link-preview-name">{preview.tool.name}</span>
                </>
              ) : (
                <span className="muted">Unknown tool — will save as a free-form link</span>
              )}
            </div>
          )}
          <input
            type="text"
            className="keys-input"
            placeholder={effectiveLabel ? `Label (default: ${effectiveLabel})` : "Label"}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
              if (e.key === "Escape") {
                setAdding(false);
                setUrl("");
                setLabel("");
              }
            }}
          />
          {error && <div className="link-error">{error}</div>}
          <div className="link-add-actions">
            <button
              type="button"
              className="ghost-btn small"
              onClick={() => {
                setAdding(false);
                setUrl("");
                setLabel("");
                setError(null);
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="primary-btn small"
              onClick={submit}
              disabled={!url.trim()}
            >
              Pin
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="link-add-btn" onClick={() => setAdding(true)}>
          <Icon.plus /> Pin a link
        </button>
      )}
    </div>
  );
}
