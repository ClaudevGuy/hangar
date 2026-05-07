import { TOOLS } from "../data/tools";
import { useStatusRadar } from "../hooks/useStatusRadar";
import type { ProviderStatus } from "../lib/statusRadar";
import type { Tool } from "../types";

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

// Stack health bar — fetches public status pages for the user's pinned tools
// and surfaces the aggregate state. Sits above Today: Today is what's broken
// in YOUR stack, this is what's broken at YOUR PROVIDERS.
export function StatusRadar({ stackTools }: Props) {
  const { statuses, loading } = useStatusRadar(stackTools);

  // No pinned tool has a known public status page — hide entirely so we
  // don't take up visual real estate for nothing.
  if (!loading && statuses.length === 0) return null;

  const operational = statuses.filter((s) => s.indicator === "none").length;
  const total = statuses.length;
  const allGreen = total > 0 && operational === total;
  const issues = statuses.filter(
    (s) => s.indicator !== "none" && s.indicator !== "unknown",
  );

  return (
    <section className={`status-radar${allGreen ? " is-green" : ""}${issues.length > 0 ? " has-issues" : ""}`}>
      <div className="status-radar-head">
        <span className="strip-label">Stack health</span>
        <span className="status-radar-summary">
          {loading && total === 0
            ? "checking…"
            : total === 0
              ? "—"
              : allGreen
                ? "all systems operational"
                : `${operational}/${total} operational`}
        </span>
      </div>
      {total > 0 && (
        <div className="status-radar-row">
          {statuses.map((s) => {
            const tool = TOOLS.find((t) => t.id === s.toolId);
            if (!tool) return null;
            const sev = SEV_BY_INDICATOR[s.indicator] ?? "unknown";
            return (
              <a
                key={s.toolId}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`status-pill sev-${sev}`}
                title={s.description || s.indicator}
              >
                <span className="status-pill-dot" />
                <span className="status-pill-name">{tool.name}</span>
              </a>
            );
          })}
        </div>
      )}
      {issues.length > 0 && (
        <ul className="status-radar-detail">
          {issues.map((s) => {
            const tool = TOOLS.find((t) => t.id === s.toolId);
            return (
              <li key={s.toolId}>
                <strong>{tool?.name ?? s.toolId}:</strong> {s.description}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
