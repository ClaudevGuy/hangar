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

export function ToolRow({
  tool, pinned, compared, onPin, onCompare, onOpen, onLaunch, onHide, onRemoveCustom,
}: Props) {
  return (
    <div className={`row ${pinned ? "is-pinned" : ""}`} onClick={() => onOpen(tool)}>
      <ToolLogo tool={tool} size={32} />
      <div className="row-name">
        <div>
          {tool.name}
          {tool.custom && <span className="row-custom-tag">custom</span>}
        </div>
        <div className="row-tag">{tool.tagline}</div>
      </div>
      <div className="row-cat">{tool.category}</div>
      <div className="row-pricing">{tool.pricing}</div>
      <div className="row-actions" onClick={(e) => e.stopPropagation()}>
        {tool.custom && onRemoveCustom && (
          <button
            type="button"
            className="chip-btn row-custom-x"
            onClick={onRemoveCustom}
            title="Remove this custom tool"
          >
            <Icon.close />
          </button>
        )}
        <button type="button" className={`chip-btn ${compared ? "on" : ""}`} onClick={() => onCompare(tool)}>
          <Icon.compare />
        </button>
        <button type="button" className={`chip-btn ${pinned ? "on" : ""}`} onClick={() => onPin(tool)}>
          {pinned ? <Icon.check /> : <Icon.plus />}
        </button>
        {/* Hide from catalog — subtle by default, brightens on row hover.
            Doesn't affect pin/stack state, just removes the row from the
            Browse list (and from category counts) until restored. */}
        <button
          type="button"
          className="chip-btn row-hide"
          onClick={() => onHide(tool)}
          title={`Hide ${tool.name} from the catalog`}
          aria-label={`Hide ${tool.name} from the catalog`}
        >
          <Icon.eyeOff />
        </button>
        <button type="button" className="launch-btn" onClick={() => onLaunch(tool)}>
          Open <Icon.arrow />
        </button>
      </div>
    </div>
  );
}
