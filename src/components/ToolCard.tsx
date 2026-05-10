import { Icon } from "../lib/icons";
import type { Tool } from "../types";
import { ToolLogo } from "./ToolLogo";

interface Props {
  tool: Tool;
  pinned: boolean;
  compared: boolean;
  onPin: (tool: Tool) => void;
  onCompare: (tool: Tool) => void;
  onOpen: (tool: Tool) => void;
  onLaunch: (tool: Tool) => void;
  onHide: (tool: Tool) => void;
  onRemoveCustom?: () => void;
}

export function ToolCard({
  tool, pinned, compared, onPin, onCompare, onOpen, onLaunch, onHide, onRemoveCustom,
}: Props) {
  return (
    <article
      className={`card ${pinned ? "is-pinned" : ""} ${compared ? "is-compared" : ""}`}
      onClick={() => onOpen(tool)}
    >
      <div className="card-top">
        <ToolLogo tool={tool} size={44} />
        <div className="card-actions" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className={`chip-btn ${compared ? "on" : ""}`}
            onClick={() => onCompare(tool)}
            title="Add to compare"
          >
            <Icon.compare />
          </button>
          <button
            type="button"
            className={`chip-btn ${pinned ? "on" : ""}`}
            onClick={() => onPin(tool)}
            title={pinned ? "Unpin" : "Pin to stack"}
          >
            {pinned ? <Icon.check /> : <Icon.plus />}
          </button>
          {/* Hide from catalog — same semantics as ToolRow's row-hide:
              removes the card from the Browse view (and category counts)
              without touching pin/stack state. Restored via the result-bar
              "X hidden · restore" link. */}
          <button
            type="button"
            className="chip-btn card-hide"
            onClick={() => onHide(tool)}
            title={`Hide ${tool.name} from the catalog`}
            aria-label={`Hide ${tool.name} from the catalog`}
          >
            <Icon.eyeOff />
          </button>
        </div>
      </div>

      <h3 className="card-name">{tool.name}</h3>
      <p className="card-tag">{tool.tagline}</p>

      <div className="card-foot">
        <span className="card-cat">{tool.category}</span>
        <button
          type="button"
          className="launch-btn"
          onClick={(e) => {
            e.stopPropagation();
            onLaunch(tool);
          }}
          title={`Open ${tool.name} dashboard`}
        >
          Open <Icon.arrow />
        </button>
      </div>

      {pinned && <div className="card-ribbon">Pinned</div>}
      {tool.custom && onRemoveCustom && (
        <button
          type="button"
          className="card-custom-x"
          onClick={(e) => {
            e.stopPropagation();
            onRemoveCustom();
          }}
          title="Remove this custom tool"
          aria-label="Remove custom tool"
        >
          <Icon.close />
        </button>
      )}
    </article>
  );
}
