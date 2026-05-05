import { Fragment } from "react";
import { Icon } from "../lib/icons";
import type { Tool } from "../types";
import { ToolLogo } from "./ToolLogo";

const FIELDS: { key: keyof Tool; label: string }[] = [
  { key: "category", label: "Category" },
  { key: "tagline", label: "What it does" },
  { key: "pricing", label: "Pricing" },
];

interface Props {
  tools: Tool[];
  onClose: () => void;
  onRemove: (id: string) => void;
  onLaunch: (tool: Tool) => void;
}

export function CompareModal({ tools, onClose, onRemove, onLaunch }: Props) {
  if (tools.length === 0) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="compare-modal" onClick={(e) => e.stopPropagation()}>
        <header className="compare-head">
          <h2>
            Compare <span className="muted">· {tools.length} tools</span>
          </h2>
          <button type="button" className="drawer-x" onClick={onClose}>
            <Icon.close />
          </button>
        </header>
        <div
          className="compare-grid"
          style={{ gridTemplateColumns: `200px repeat(${tools.length}, 1fr)` }}
        >
          <div className="compare-corner" />
          {tools.map((t) => (
            <div key={t.id} className="compare-tool-head">
              <ToolLogo tool={t} size={36} />
              <div className="compare-tool-name">{t.name}</div>
              <div className="compare-tool-cat">{t.category}</div>
              <button type="button" className="ghost-btn small" onClick={() => onRemove(t.id)}>
                <Icon.close /> Remove
              </button>
            </div>
          ))}
          {FIELDS.map((f) => (
            <Fragment key={f.key}>
              <div className="compare-row-label">{f.label}</div>
              {tools.map((t) => (
                <div key={t.id} className="compare-cell">
                  {t[f.key] ?? <span className="muted">—</span>}
                </div>
              ))}
            </Fragment>
          ))}
          <div className="compare-row-label">Open</div>
          {tools.map((t) => (
            <div key={t.id} className="compare-cell">
              <button type="button" className="launch-btn block" onClick={() => onLaunch(t)}>
                Launch <Icon.arrow />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
