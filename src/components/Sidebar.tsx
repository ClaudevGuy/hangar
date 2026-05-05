import { ACTIVITY, CATEGORIES, TOOLS } from "../data/tools";
import { Icon } from "../lib/icons";
import type { CategoryId, Tool } from "../types";
import { ToolLogo } from "./ToolLogo";

interface Props {
  active: CategoryId;
  setActive: (id: CategoryId) => void;
  counts: Partial<Record<CategoryId, number>>;
  stackTools: Tool[];
  onRemoveStack: (id: string) => void;
  onOpenTool: (tool: Tool) => void;
}

export function Sidebar({ active, setActive, counts, stackTools, onRemoveStack, onOpenTool }: Props) {
  return (
    <aside className="sidebar">
      <div className="side-section">
        <div className="side-label">Categories</div>
        <nav className="cat-nav">
          {CATEGORIES.map((c) => (
            <button
              type="button"
              key={c.id}
              className={`cat-btn ${active === c.id ? "active" : ""}`}
              onClick={() => setActive(c.id)}
            >
              <span className="cat-icon">{c.icon}</span>
              <span className="cat-name">{c.name}</span>
              <span className="cat-count">{counts[c.id] ?? 0}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="side-section">
        <div className="side-label">
          My stack <span className="lbl-count">{stackTools.length}</span>
        </div>
        {stackTools.length === 0 ? (
          <div className="empty-stack">
            <Icon.pin />
            <span>Pin tools you actually use to build your stack.</span>
          </div>
        ) : (
          <ul className="stack-list">
            {stackTools.map((t) => (
              <li key={t.id} className="stack-item">
                <button type="button" className="stack-main" onClick={() => onOpenTool(t)}>
                  <ToolLogo tool={t} size={26} />
                  <div className="stack-meta">
                    <div className="stack-name">{t.name}</div>
                    <div className="stack-cat">
                      {t.category}
                      {t.plan ? ` · ${t.plan}` : ""}
                    </div>
                  </div>
                  {t.status === "live" && <span className="status-dot" title="Live" />}
                </button>
                <button
                  type="button"
                  className="stack-x"
                  onClick={() => onRemoveStack(t.id)}
                  title="Unpin"
                >
                  <Icon.close />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="side-section side-foot">
        <div className="side-label">Activity</div>
        <ul className="activity">
          {ACTIVITY.slice(0, 5).map((a, i) => {
            const tool = TOOLS.find((t) => t.id === a.tool);
            return (
              <li key={i}>
                {tool && <ToolLogo tool={tool} size={18} />}
                <div className="act-text">
                  <span className="act-line">{a.text}</span>
                  {a.repo && <span className="act-repo">{a.repo}</span>}
                </div>
                <span className="act-time">{a.time}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
