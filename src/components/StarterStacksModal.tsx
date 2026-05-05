import { useEffect } from "react";
import { TOOLS } from "../data/tools";
import { STARTER_STACKS, type StarterStack } from "../data/starterStacks";
import { Icon } from "../lib/icons";
import type { Tool } from "../types";
import { ToolLogo } from "./ToolLogo";

interface Props {
  onAdopt: (toolIds: string[]) => void;
  onClose: () => void;
}

export function StarterStacksModal({ onAdopt, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="starters-modal" onClick={(e) => e.stopPropagation()}>
        <header className="compare-head">
          <h2>
            Starter stacks <span className="muted">· pick one to seed your stack</span>
          </h2>
          <button type="button" className="drawer-x" onClick={onClose}>
            <Icon.close />
          </button>
        </header>
        <div className="starters-grid">
          {STARTER_STACKS.map((stack) => (
            <StarterCard
              key={stack.id}
              stack={stack}
              onAdopt={() => {
                onAdopt(stack.toolIds);
                onClose();
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface CardProps {
  stack: StarterStack;
  onAdopt: () => void;
}

function StarterCard({ stack, onAdopt }: CardProps) {
  const tools: Tool[] = stack.toolIds
    .map((id) => TOOLS.find((t) => t.id === id))
    .filter((t): t is Tool => Boolean(t));

  return (
    <article className="starter-card">
      <header className="starter-head">
        <div>
          <div className="starter-name">{stack.name}</div>
          <div className="starter-tag">{stack.tagline}</div>
        </div>
        <span className="starter-count">
          {tools.length} {tools.length === 1 ? "tool" : "tools"}
        </span>
      </header>
      <div className="starter-tools">
        {tools.map((t) => (
          <div key={t.id} className="starter-tool" title={t.name}>
            <ToolLogo tool={t} size={28} />
            <span>{t.name}</span>
          </div>
        ))}
      </div>
      <button type="button" className="primary-btn small starter-adopt" onClick={onAdopt}>
        Adopt this stack <Icon.arrow />
      </button>
    </article>
  );
}
