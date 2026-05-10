// Compact stack stats — replaces the ControlDeck's deck-stats grid. Renders
// as a single inline strip just above the catalog divider so the same
// information stays visible without burning a full panel of vertical space.
//
// Each cell is a clickable label-value-foot chip. Destinations are now
// distinct per metric (was: 3 of 5 cells all opened StackModal):
//   - Pinned    → StackModal       (pin/unpin lives there)
//   - Connected → KeysModal        ("connected" = has a key, vault is the place)
//   - Keys      → KeysModal        (also vault — same destination, different framing)
//   - $/mo      → StackModal       (per-tool plans drive the cost calc)
//   - Catalog   → toggleCatalog    (was static — now opens/closes the Browse list)

import { TOOLS } from "../data/tools";
import type { ToolMetaMap } from "../hooks/useToolMeta";
import { monthlyTotal } from "../lib/cost";
import { Icon } from "../lib/icons";
import type { SecretsMap, Tool } from "../types";

interface Props {
  stackTools: Tool[];
  totalTools: number;
  secrets: SecretsMap;
  toolMeta: ToolMetaMap;
  onOpenStack: () => void;
  onOpenKeys: () => void;
  onToggleCatalog: () => void;
  catalogOpen: boolean;
}

// Where a cell sends the user when clicked. Drives the destination
// label rendered under each cell on hover so the user knows what'll
// happen before they click.
type Destination = "stack" | "keys" | "catalog";

const DEST_LABEL: Record<Destination, string> = {
  stack: "Open My Stack",
  keys: "Open Keys vault",
  catalog: "Toggle catalog",
};

export function DashStats({
  stackTools,
  totalTools,
  secrets,
  toolMeta,
  onOpenStack,
  onOpenKeys,
  onToggleCatalog,
  catalogOpen,
}: Props) {
  const stackCategories = new Set(stackTools.map((t) => t.category)).size;
  const totalCategories = new Set(TOOLS.map((t) => t.category)).size;
  const connectedCount = stackTools.filter(
    (t) => (secrets[t.id]?.length ?? 0) > 0,
  ).length;
  const totalKeysCount = Object.values(secrets).reduce(
    (sum, list) => sum + list.length,
    0,
  );
  const toolsWithKeys = Object.keys(secrets).filter(
    (id) => (secrets[id]?.length ?? 0) > 0,
  ).length;
  const cost = monthlyTotal(stackTools, (id) => toolMeta[id]?.plan);

  return (
    <div className="dash-stats" role="group" aria-label="Stack at a glance">
      <Cell
        icon={<Icon.pin filled />}
        label="pinned"
        num={String(stackTools.length)}
        foot={
          stackTools.length === 0
            ? `of ${totalTools}`
            : `${stackCategories} ${stackCategories === 1 ? "cat" : "cats"}`
        }
        destination="stack"
        onClick={onOpenStack}
      />
      <span className="ds-sep" aria-hidden="true" />
      <Cell
        icon={<span className="ds-pulse" aria-hidden="true" />}
        label="connected"
        num={String(connectedCount)}
        foot={stackTools.length === 0 ? "—" : `of ${stackTools.length}`}
        destination="keys"
        onClick={onOpenKeys}
        // Active green-ish dot whenever any tool is connected so the
        // status reads at a glance without needing to compute the foot.
        emphasizeIcon={connectedCount > 0}
      />
      <span className="ds-sep" aria-hidden="true" />
      <Cell
        icon={<Icon.key />}
        label="keys"
        num={String(totalKeysCount)}
        foot={
          totalKeysCount === 0
            ? "vault empty"
            : `${toolsWithKeys} ${toolsWithKeys === 1 ? "tool" : "tools"}`
        }
        destination="keys"
        onClick={onOpenKeys}
      />
      <span className="ds-sep" aria-hidden="true" />
      <Cell
        icon={<span className="ds-glyph" aria-hidden="true">$</span>}
        label="/ mo"
        num={`$${cost.total.toFixed(0)}`}
        foot={cost.tracked === 0 ? "set plans" : `${cost.tracked} tracked`}
        destination="stack"
        onClick={onOpenStack}
      />
      <span className="ds-sep" aria-hidden="true" />
      <Cell
        icon={<Icon.grid />}
        label={catalogOpen ? "catalog open" : "in catalog"}
        num={String(totalTools)}
        foot={`${totalCategories} ${totalCategories === 1 ? "cat" : "cats"}`}
        destination="catalog"
        onClick={onToggleCatalog}
        active={catalogOpen}
      />
    </div>
  );
}

interface CellProps {
  icon: React.ReactNode;
  label: string;
  num: string;
  foot: string;
  destination: Destination;
  onClick: () => void;
  // True when the cell represents an "on" state (e.g. catalog currently
  // open) — gets a subtle accent border so the user can tell.
  active?: boolean;
  // Render the icon in accent color (e.g. the green dot when connected).
  emphasizeIcon?: boolean;
}

function Cell({
  icon,
  label,
  num,
  foot,
  destination,
  onClick,
  active,
  emphasizeIcon,
}: CellProps) {
  return (
    <button
      type="button"
      className={`ds-cell${active ? " is-active" : ""}`}
      onClick={onClick}
      title={DEST_LABEL[destination]}
    >
      <span className={`ds-icon${emphasizeIcon ? " is-emphasized" : ""}`}>
        {icon}
      </span>
      <span className="ds-num">{num}</span>
      <span className="ds-lbl">{label}</span>
      <span className="ds-foot">{foot}</span>
    </button>
  );
}
