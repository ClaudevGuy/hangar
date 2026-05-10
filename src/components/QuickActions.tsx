// Quick Actions shelf — a single horizontal row of action cards that lives
// between the Inbox and the catalog footer. Replaces what used to be the
// ControlDeck's stat tiles + redundant stack-launcher.
//
// Five evergreen entry points, each with its own keyboard hint where one
// exists. The catalog toggle moved here too, so "Browse catalog" is a real
// CTA card instead of a thin divider button buried at the page bottom.

import { Icon } from "../lib/icons";

interface Props {
  onOpenAsk: () => void;
  onOpenSearch: () => void;
  onOpenLogs: () => void;
  onOpenRepoScan: () => void;
  onOpenAddTool: () => void;
  onToggleCatalog: () => void;
  catalogOpen: boolean;
  catalogCount: number;
}

interface Action {
  key: string;
  label: string;
  desc: string;
  glyph: React.ReactNode;
  kbd?: string;
  // Renders the spark glyph in the accent color when true — used to flag
  // AI-powered actions (Ask) so they read as "smart" not just "search".
  smart?: boolean;
  onClick: () => void;
  // Right-side hint (e.g. catalog count) when present.
  hint?: string;
  // Pressed-style for stateful toggles (catalog open).
  pressed?: boolean;
}

export function QuickActions({
  onOpenAsk,
  onOpenSearch,
  onOpenLogs,
  onOpenRepoScan,
  onOpenAddTool,
  onToggleCatalog,
  catalogOpen,
  catalogCount,
}: Props) {
  const actions: Action[] = [
    {
      key: "search",
      label: "Search stack",
      desc: "deploys, issues, repos, notes",
      glyph: <Icon.search />,
      kbd: "⌘⇧F",
      onClick: onOpenSearch,
    },
    {
      key: "ask",
      label: "Ask Hangar",
      desc: "questions across your tools",
      glyph: <span className="qa-spark" aria-hidden="true">✦</span>,
      kbd: "⌘⇧A",
      smart: true,
      onClick: onOpenAsk,
    },
    {
      key: "logs",
      label: "Logs",
      desc: "every event across your stack",
      glyph: <span className="qa-glyph-emoji" aria-hidden="true">≡</span>,
      onClick: onOpenLogs,
    },
    {
      key: "scan",
      label: "Scan a repo",
      desc: "detect tools + import keys",
      glyph: <span className="qa-glyph-emoji" aria-hidden="true">⌕</span>,
      onClick: onOpenRepoScan,
    },
    {
      key: "catalog",
      label: catalogOpen ? "Hide catalog" : "Browse catalog",
      desc: "all tools + categories",
      glyph: <Icon.grid />,
      hint: `${catalogCount}`,
      pressed: catalogOpen,
      onClick: onToggleCatalog,
    },
    {
      key: "add",
      label: "Add tool",
      desc: "track something custom",
      glyph: <Icon.plus />,
      onClick: onOpenAddTool,
    },
  ];

  return (
    <section className="dash-actions" aria-label="Quick actions">
      {/* No section label — the cards' own labels are self-explanatory and
          a tiny "Quick actions" / "Do" header was dead visual weight that
          read as random noise rather than navigation. NOTE: class is
          .dash-actions (not .quick-actions) to avoid colliding with the
          pre-existing .quick-actions selector used inside the ToolDrawer. */}
      <div className="qa-grid">
        {actions.map((a) => (
          <button
            key={a.key}
            type="button"
            className={`qa-card${a.smart ? " is-smart" : ""}${a.pressed ? " is-pressed" : ""}`}
            onClick={a.onClick}
          >
            <span className="qa-glyph">{a.glyph}</span>
            <span className="qa-body">
              <span className="qa-label">{a.label}</span>
              <span className="qa-desc">{a.desc}</span>
            </span>
            {a.kbd && <kbd className="qa-kbd">{a.kbd}</kbd>}
            {a.hint && <span className="qa-hint">{a.hint}</span>}
          </button>
        ))}
      </div>
    </section>
  );
}
