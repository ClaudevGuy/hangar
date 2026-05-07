import { useEffect, useRef, useState } from "react";
import { TOOLS } from "../data/tools";
import { useStatusRadar } from "../hooks/useStatusRadar";
import type { ProviderStatus } from "../lib/statusRadar";
import { Icon } from "../lib/icons";
import type { Tool } from "../types";
import { ToolLogo } from "./ToolLogo";

interface Props {
  stackTools: Tool[];
}

type Sev = "ok" | "minor" | "major" | "maintenance" | "unknown";

const SEV_BY_INDICATOR: Record<ProviderStatus["indicator"], Sev> = {
  none: "ok",
  minor: "minor",
  major: "major",
  critical: "major",
  maintenance: "maintenance",
  unknown: "unknown",
};

const STATUS_LABEL: Record<ProviderStatus["indicator"], string> = {
  none: "operational",
  minor: "minor issue",
  major: "major issue",
  critical: "outage",
  maintenance: "maintenance",
  unknown: "unknown",
};

// Stack Health — a compact pill in the topbar (with severity-coded dot +
// "X/Y" count) that opens a popover listing each pinned tool's public
// status. Quiet by default, pulses warm when something's degraded.
export function StatusRadar({ stackTools }: Props) {
  const { statuses, loading } = useStatusRadar(stackTools);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Hide entirely when there's nothing to surface — no pinned tool has a
  // known status page, and we're not still mid-fetch.
  if (!loading && statuses.length === 0) return null;

  const operational = statuses.filter((s) => s.indicator === "none").length;
  const total = statuses.length;
  const allGreen = total > 0 && operational === total;
  const issues = statuses.filter(
    (s) => s.indicator !== "none" && s.indicator !== "unknown",
  );
  const triggerSev: "loading" | "ok" | "issues" =
    loading && total === 0 ? "loading" : issues.length > 0 ? "issues" : "ok";

  return (
    <div className="status-radar-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`status-pill-trigger sev-${triggerSev}${open ? " is-open" : ""}`}
        onClick={() => setOpen((s) => !s)}
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Stack health — public status pages for your pinned tools"
      >
        <span className="status-pill-trigger-dot" />
        <span className="status-pill-trigger-count">
          {triggerSev === "loading" ? "…" : `${operational}/${total}`}
        </span>
      </button>

      {open && (
        <div className="status-radar-popover" role="dialog" aria-label="Stack health">
          <div className="status-radar-pop-head">
            <div className="status-radar-pop-label">
              <span className={`status-pill-trigger-dot sev-${triggerSev}`} />
              <span>Stack health</span>
            </div>
            <span className="status-radar-pop-summary">
              {triggerSev === "loading"
                ? "checking…"
                : allGreen
                  ? "all systems operational"
                  : issues.length > 0
                    ? `${issues.length} ${issues.length === 1 ? "issue" : "issues"}`
                    : `${operational}/${total} operational`}
            </span>
          </div>
          <div className="status-radar-pop-body">
            {statuses.map((s) => {
              const tool = TOOLS.find((t) => t.id === s.toolId);
              if (!tool) return null;
              const sev = SEV_BY_INDICATOR[s.indicator] ?? "unknown";
              return (
                <a
                  key={s.toolId}
                  className={`status-radar-row sev-${sev}`}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ToolLogo tool={tool} size={20} />
                  <span className="status-radar-row-name">{tool.name}</span>
                  <span className={`status-radar-row-dot sev-${sev}`} />
                  <span className="status-radar-row-status">
                    {STATUS_LABEL[s.indicator] ?? s.indicator}
                  </span>
                  <Icon.arrow />
                </a>
              );
            })}
          </div>
          {issues.length > 0 && (
            <div className="status-radar-pop-detail">
              {issues.map((s) => {
                const tool = TOOLS.find((t) => t.id === s.toolId);
                return (
                  <p key={s.toolId}>
                    <strong>{tool?.name ?? s.toolId}:</strong> {s.description}
                  </p>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
