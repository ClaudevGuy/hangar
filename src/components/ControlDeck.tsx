import { TOOLS } from "../data/tools";
import { useDragScroll } from "../hooks/useDragScroll";
import { Icon } from "../lib/icons";
import type { SecretsMap, Tool } from "../types";
import { ToolLogo } from "./ToolLogo";

const POPULAR_IDS = [
  "neon", "vercel", "resend", "inngest", "clerk", "stripe",
  "anthropic", "sentry", "posthog", "figma", "linear", "supabase",
];

interface Props {
  stackTools: Tool[];
  totalTools: number;
  secrets: SecretsMap;
  onPick: (tool: Tool) => void;
  onLaunch: (tool: Tool) => void;
  onOpenStack: () => void;
}

export function ControlDeck({ stackTools, totalTools, secrets, onPick, onLaunch, onOpenStack }: Props) {
  const stackCategories = new Set(stackTools.map((t) => t.category)).size;
  const totalCategories = new Set(TOOLS.map((t) => t.category)).size;
  const connectedCount = stackTools.filter((t) => (secrets[t.id]?.length ?? 0) > 0).length;
  const totalKeysCount = Object.values(secrets).reduce((sum, list) => sum + list.length, 0);
  const toolsWithKeys = Object.keys(secrets).filter((id) => (secrets[id]?.length ?? 0) > 0).length;
  const { ref: railRef, dragging } = useDragScroll<HTMLDivElement>();
  const { ref: launcherRef, dragging: launcherDragging } = useDragScroll<HTMLDivElement>();

  return (
    <section className="deck">
      {stackTools.length > 0 && (
        <div className="stack-launcher">
          <div className="stack-launcher-head">
            <div className="strip-label">Your stack</div>
            <button type="button" className="ghost-btn small" onClick={onOpenStack}>
              Manage <Icon.arrow />
            </button>
          </div>
          <div
            ref={launcherRef}
            className={`stack-launcher-row ${launcherDragging ? "is-dragging" : ""}`}
          >
            {stackTools.map((t) => (
              <button
                type="button"
                key={t.id}
                className="launcher-tile"
                onClick={() => onLaunch(t)}
                title={`Open ${t.name} dashboard`}
              >
                <ToolLogo tool={t} size={32} />
                <div className="launcher-tile-meta">
                  <div className="launcher-tile-name">{t.name}</div>
                  <div className="launcher-tile-cat">{t.category}</div>
                </div>
                <Icon.arrow />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="deck-stats">
        <div className="stat">
          <div className="stat-lbl">Pinned</div>
          <div className="stat-num">{stackTools.length}</div>
          <div className="stat-foot">
            {stackTools.length === 0
              ? `none yet · ${totalTools} in catalog`
              : `of ${totalTools} · ${stackCategories} ${stackCategories === 1 ? "category" : "categories"}`}
          </div>
        </div>
        <div className="stat">
          <div className="stat-lbl">
            {connectedCount > 0 && <span className="status-dot live" />}
            Connected
          </div>
          <div className="stat-num">{connectedCount}</div>
          <div className="stat-foot">
            {stackTools.length === 0
              ? "pin a tool to start"
              : connectedCount === 0
                ? "no keys stored"
                : `of ${stackTools.length} pinned · key in vault`}
          </div>
        </div>
        <div className="stat">
          <div className="stat-lbl">Keys</div>
          <div className="stat-num">{totalKeysCount}</div>
          <div className="stat-foot">
            {totalKeysCount === 0
              ? "vault is empty"
              : `across ${toolsWithKeys} ${toolsWithKeys === 1 ? "tool" : "tools"}`}
          </div>
        </div>
        <div className="stat">
          <div className="stat-lbl">In catalog</div>
          <div className="stat-num">{totalTools}</div>
          <div className="stat-foot">
            {totalCategories} {totalCategories === 1 ? "category" : "categories"}
          </div>
        </div>
      </div>

      <div className="deck-strip">
        <div className="strip-label">{stackTools.length === 0 ? "Start with a popular pick" : "Discover more"}</div>
        <div ref={railRef} className={`strip-rail ${dragging ? "is-dragging" : ""}`}>
          {POPULAR_IDS.map((id) => {
            const t = TOOLS.find((x) => x.id === id);
            if (!t) return null;
            return (
              <button type="button" key={id} className="strip-tool" onClick={() => onPick(t)}>
                <ToolLogo tool={t} size={28} />
                <span>{t.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
