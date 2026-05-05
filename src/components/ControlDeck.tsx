import { TOOLS } from "../data/tools";
import { useDragScroll } from "../hooks/useDragScroll";
import type { Tool } from "../types";
import { ToolLogo } from "./ToolLogo";

const TRENDING_IDS = [
  "neon", "vercel", "resend", "inngest", "clerk", "stripe",
  "anthropic", "sentry", "posthog", "figma", "linear", "supabase",
];

interface Props {
  stackTools: Tool[];
  totalTools: number;
  onPick: (tool: Tool) => void;
}

export function ControlDeck({ stackTools, totalTools, onPick }: Props) {
  const live = stackTools.filter((t) => t.status === "live").length;
  const monthly = stackTools.reduce((sum, t) => {
    const m = t.pricing.match(/\$(\d+)\/mo/);
    return sum + (m ? Number(m[1]) : 0);
  }, 0);
  const monthlyTools = stackTools.filter((t) => /\$(\d+)\/mo/.test(t.pricing)).length;
  const stackCategories = new Set(stackTools.map((t) => t.category)).size;
  const totalCategories = new Set(TOOLS.map((t) => t.category)).size;
  const { ref: railRef, dragging } = useDragScroll<HTMLDivElement>();

  return (
    <section className="deck">
      <div className="deck-grain" />

      <div className="deck-head">
        <div className="deck-eyebrow">
          <span className="pulse" />
          Hangar / control tower
        </div>
        <h1 className="deck-title">
          Every tool you ship with.
          <br />
          <span className="deck-title-soft">One quiet hangar.</span>
        </h1>
        <p className="deck-sub">
          Stop hopping between {totalTools}+ dashboards. Pin the tools you actually use,
          jump straight into your accounts, and watch your whole stack from one runway.
        </p>
      </div>

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
            {live > 0 && <span className="status-dot live" />}
            Live now
          </div>
          <div className="stat-num">{live}</div>
          <div className="stat-foot">
            {stackTools.length === 0
              ? "pin a tool to start"
              : live === stackTools.length
                ? "all healthy"
                : `of ${stackTools.length} pinned`}
          </div>
        </div>
        <div className="stat">
          <div className="stat-lbl">Recurring</div>
          <div className="stat-num">
            <span className="stat-currency">$</span>
            {monthly}
            <span className="stat-unit">/mo</span>
          </div>
          <div className="stat-foot">
            {monthlyTools === 0 ? "—" : `${monthlyTools} ${monthlyTools === 1 ? "plan" : "plans"}`}
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
        <div className="strip-label">Popular picks</div>
        <div ref={railRef} className={`strip-rail ${dragging ? "is-dragging" : ""}`}>
          {TRENDING_IDS.map((id) => {
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
