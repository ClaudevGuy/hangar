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

export function ToolCard({ tool, pinned, compared, onPin, onCompare, onOpen, onLaunch }: Props) {
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
    </article>
  );
}
