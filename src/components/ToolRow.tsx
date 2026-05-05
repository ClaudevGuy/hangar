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
}

export function ToolRow({ tool, pinned, compared, onPin, onCompare, onOpen, onLaunch }: Props) {
  return (
    <div className={`row ${pinned ? "is-pinned" : ""}`} onClick={() => onOpen(tool)}>
      <ToolLogo tool={tool} size={32} />
      <div className="row-name">
        <div>{tool.name}</div>
        <div className="row-tag">{tool.tagline}</div>
      </div>
      <div className="row-cat">{tool.category}</div>
      <div className="row-pricing">{tool.pricing}</div>
      <div className="row-status">
        {tool.status === "live" ? (
          <>
            <span className="status-dot live" /> {tool.plan}
          </>
        ) : (
          <span className="muted">—</span>
        )}
      </div>
      <div className="row-actions" onClick={(e) => e.stopPropagation()}>
        <button type="button" className={`chip-btn ${compared ? "on" : ""}`} onClick={() => onCompare(tool)}>
          <Icon.compare />
        </button>
        <button type="button" className={`chip-btn ${pinned ? "on" : ""}`} onClick={() => onPin(tool)}>
          {pinned ? <Icon.check /> : <Icon.plus />}
        </button>
        <button type="button" className="launch-btn" onClick={() => onLaunch(tool)}>
          Open <Icon.arrow />
        </button>
      </div>
    </div>
  );
}
