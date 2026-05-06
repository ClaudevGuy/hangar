import { ACTIVITY, CATEGORIES, TOOLS } from "../data/tools";
import type { ToolMetaMap } from "../hooks/useToolMeta";
import { Icon } from "../lib/icons";
import { timeAgo } from "../lib/timeAgo";
import type { CategoryId, LinkItem, Tool } from "../types";
import { Linkboard } from "./Linkboard";
import { ToolLogo } from "./ToolLogo";

interface Props {
  active: CategoryId;
  setActive: (id: CategoryId) => void;
  counts: Partial<Record<CategoryId, number>>;
  stackTools: Tool[];
  customTools: Tool[];
  toolMeta: ToolMetaMap;
  onRemoveStack: (id: string) => void;
  onOpenTool: (tool: Tool) => void;
  onOpenStarters: () => void;
  // Linkboard props
  links: LinkItem[];
  onAddLink: (entry: Omit<LinkItem, "id" | "addedAt">) => void;
  onRemoveLink: (id: string) => void;
  onClearLinks: () => void;
}

export function Sidebar({
  active, setActive, counts, stackTools, customTools, toolMeta, onRemoveStack, onOpenTool, onOpenStarters,
  links, onAddLink, onRemoveLink, onClearLinks,
}: Props) {
  return (
    <aside className="sidebar">
      <Linkboard
        links={links}
        builtInTools={TOOLS}
        customTools={customTools}
        onAdd={onAddLink}
        onRemove={onRemoveLink}
        onClear={onClearLinks}
      />

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
          <div className="empty-stack empty-stack-cta">
            <span>
              <Icon.pin /> Pin tools you actually use to build your stack — or jumpstart with a starter.
            </span>
            <button type="button" className="primary-btn small" onClick={onOpenStarters}>
              Try a starter stack
            </button>
          </div>
        ) : (
          <ul className="stack-list">
            {stackTools.map((t) => {
              const m = toolMeta[t.id];
              const plan = m?.plan ?? t.plan;
              const lastOpenedAt = m?.lastOpenedAt;
              const metaParts: string[] = [t.category];
              if (plan) metaParts.push(plan);
              if (lastOpenedAt) metaParts.push(timeAgo(lastOpenedAt));
              return (
              <li key={t.id} className="stack-item">
                <button type="button" className="stack-main" onClick={() => onOpenTool(t)}>
                  <ToolLogo tool={t} size={26} />
                  <div className="stack-meta">
                    <div className="stack-name">{t.name}</div>
                    <div className="stack-cat">{metaParts.join(" · ")}</div>
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
              );
            })}
          </ul>
        )}
      </div>

      {ACTIVITY.length > 0 && (
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
      )}
    </aside>
  );
}
