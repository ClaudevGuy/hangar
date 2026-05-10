import type { CSSProperties } from "react";
import { TOOLS } from "../data/tools";
import { QUICK_ACTIONS } from "../data/quickActions";
import { useNotes } from "../hooks/useNotes";
import { useSnippets } from "../hooks/useSnippets";
import type { ToolMetaMap } from "../hooks/useToolMeta";
import { useToolTags } from "../hooks/useToolTags";
import { parsePricingTiers, type PricingTier } from "../lib/cost";
import { Icon } from "../lib/icons";
import type { SecretsMap, Tool } from "../types";
import { GitHubInsights } from "./GitHubInsights";
import { LinearInsights } from "./LinearInsights";
import { NotesSection } from "./NotesSection";
import { ResendInsights } from "./ResendInsights";
import { SentryInsights } from "./SentryInsights";
import { SnippetsSection } from "./SnippetsSection";
import { TagsEditor } from "./TagsEditor";
import { TokenPrompt } from "./TokenPrompt";
import { VercelInsights } from "./VercelInsights";
import { ToolLogo } from "./ToolLogo";

interface Props {
  tool: Tool | null;
  pinned: boolean;
  secrets: SecretsMap;
  toolMeta: ToolMetaMap;
  onClose: () => void;
  onPin: (tool: Tool) => void;
  onLaunch: (tool: Tool) => void;
  onSetPlan: (toolId: string, plan: string | null) => void;
  onOpenKeys: () => void;
  onAddKeyForTool: (tool: Tool) => void;
  onEditCustomTool: (tool: Tool) => void;
  onRemoveCustomTool: (tool: Tool) => void;
}

function formatTier(tier: PricingTier): string {
  if (tier.monthly === 0) return tier.name;
  if (tier.monthly != null) return `${tier.name} · $${tier.monthly}/mo`;
  return tier.name;
}

export function ToolDrawer({
  tool, pinned, secrets, toolMeta, onClose, onPin, onLaunch, onSetPlan, onOpenKeys, onAddKeyForTool,
  onEditCustomTool, onRemoveCustomTool,
}: Props) {
  // Hooks must run on every render — call before the early null return.
  const notes = useNotes();
  const toolNotes = tool ? notes.notesForTool(tool.id) : [];
  const tags = useToolTags();
  const toolTags = tool ? tags.tagsFor(tool.id) : [];
  const tagSuggestions = tags.allTags.map((entry) => entry.tag);
  const snippets = useSnippets();
  const toolSnippets = tool ? snippets.snippetsFor(tool.id) : [];

  if (!tool) return null;

  const effectivePlan = toolMeta[tool.id]?.plan ?? tool.plan ?? "";
  const tiers = parsePricingTiers(tool.pricing);
  const planInTiers = tiers.some((t) => t.name.toLowerCase() === effectivePlan.toLowerCase());

  const pairs = TOOLS.filter((t) => t.id !== tool.id).slice(0, 6);

  // Per-tool brand color hooks for `.drawer-cat` accent.
  const drawerStyle = {
    "--brand": tool.color,
    "--brand-bg": tool.bg,
  } as CSSProperties;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()} style={drawerStyle}>
        <button type="button" className="drawer-x" onClick={onClose}>
          <Icon.close />
        </button>

        <div className="drawer-hero">
          <ToolLogo tool={tool} size={64} />
          <div>
            <div className="drawer-cat">{tool.category}</div>
            <h2 className="drawer-title">{tool.name}</h2>
            <p className="drawer-tag">{tool.tagline}</p>
          </div>
        </div>

        <div className="drawer-cta">
          <button type="button" className="primary-btn" onClick={() => onLaunch(tool)}>
            Open {tool.name} <Icon.arrow />
          </button>
          <button
            type="button"
            className={`secondary-btn ${pinned ? "on" : ""}`}
            onClick={() => onPin(tool)}
          >
            {pinned ? (
              <>
                <Icon.check /> Pinned to stack
              </>
            ) : (
              <>
                <Icon.plus /> Pin to stack
              </>
            )}
          </button>
          <button
            type="button"
            className="secondary-btn"
            onClick={() => onAddKeyForTool(tool)}
            title={`Manage ${tool.name} API keys`}
          >
            <Icon.key />
            {(secrets[tool.id]?.length ?? 0) > 0
              ? `${secrets[tool.id]!.length} ${secrets[tool.id]!.length === 1 ? "key" : "keys"}`
              : "Add key"}
          </button>
          {tool.custom && (
            <>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => onEditCustomTool(tool)}
                title="Edit this custom tool"
              >
                Edit
              </button>
              <button
                type="button"
                className="secondary-btn drawer-danger"
                onClick={() => {
                  if (window.confirm(`Remove "${tool.name}" from your custom tools?`)) {
                    onRemoveCustomTool(tool);
                  }
                }}
                title="Remove this custom tool"
              >
                <Icon.trash />
              </button>
            </>
          )}
        </div>

        <dl className="drawer-meta">
          <div>
            <dt>Account</dt>
            <dd>
              <a href={tool.accountUrl} target="_blank" rel="noreferrer">
                {tool.accountUrl.replace("https://", "")}
              </a>
            </dd>
          </div>
          <div>
            <dt>Docs</dt>
            <dd>
              <a href={tool.docs} target="_blank" rel="noreferrer">
                {tool.docs.replace("https://", "")}
              </a>
            </dd>
          </div>
          <div>
            <dt>Pricing</dt>
            <dd>{tool.pricing}</dd>
          </div>
          <div>
            <dt>Your plan</dt>
            <dd>
              <select
                className="plan-select"
                value={effectivePlan}
                onChange={(e) => onSetPlan(tool.id, e.target.value || null)}
              >
                <option value="">Not set</option>
                {tiers.map((tier) => (
                  <option key={tier.name} value={tier.name}>
                    {formatTier(tier)}
                  </option>
                ))}
                {effectivePlan && !planInTiers && (
                  <option value={effectivePlan}>{effectivePlan}</option>
                )}
              </select>
            </dd>
          </div>
          {tool.status === "live" && (
            <div>
              <dt>Status</dt>
              <dd>
                <span className="status-dot live" /> Live
              </dd>
            </div>
          )}
        </dl>

        {tool.id === "github" && (
          <div className="drawer-section">
            <GitHubInsights secrets={secrets} onOpenKeys={onOpenKeys} />
          </div>
        )}

        {tool.id === "linear" && (
          <div className="drawer-section">
            <LinearInsights secrets={secrets} onAddKey={() => onAddKeyForTool(tool)} />
          </div>
        )}

        {tool.id === "vercel" && (
          <div className="drawer-section">
            <VercelInsights secrets={secrets} onAddKey={() => onAddKeyForTool(tool)} />
          </div>
        )}

        {tool.id === "neon" && (
          <div className="drawer-section">
            <TokenPrompt
              toolId="neon"
              toolName="Neon"
              description="Add a Neon API key to your vault to see your projects and recent branches."
              tokenUrl="https://console.neon.tech/app/settings/api-keys"
              secrets={secrets}
              onAddKey={() => onAddKeyForTool(tool)}
            />
          </div>
        )}

        {tool.id === "inngest" && (
          <div className="drawer-section">
            <TokenPrompt
              toolId="inngest"
              toolName="Inngest"
              description="Add an Inngest signing key to your vault to surface recent function runs and event activity."
              tokenUrl="https://app.inngest.com/env/production/manage/signing-key"
              secrets={secrets}
              onAddKey={() => onAddKeyForTool(tool)}
            />
          </div>
        )}

        {tool.id === "resend" && (
          <div className="drawer-section">
            <ResendInsights secrets={secrets} onAddKey={() => onAddKeyForTool(tool)} />
          </div>
        )}

        {tool.id === "sentry" && (
          <div className="drawer-section">
            <SentryInsights secrets={secrets} onAddKey={() => onAddKeyForTool(tool)} />
          </div>
        )}

        {QUICK_ACTIONS[tool.id] && QUICK_ACTIONS[tool.id]!.length > 0 && (
          <div className="drawer-section">
            <div className="drawer-section-title">Quick actions</div>
            <ul className="quick-actions">
              {QUICK_ACTIONS[tool.id]!.map((action) => (
                <li key={action.url}>
                  <a
                    href={action.url}
                    target="_blank"
                    rel="noreferrer"
                    title={action.description}
                  >
                    <span className="quick-action-label">{action.label}</span>
                    <Icon.arrow />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="drawer-section">
          <div className="drawer-section-title">
            Tags
            {toolTags.length > 0 && (
              <span className="drawer-section-count">{toolTags.length}</span>
            )}
          </div>
          <TagsEditor
            tags={toolTags}
            onAdd={(tag) => tags.addTag(tool.id, tag)}
            onRemove={(tag) => tags.removeTag(tool.id, tag)}
            suggestions={tagSuggestions}
          />
        </div>

        <div className="drawer-section">
          <div className="drawer-section-title">
            Snippets
            {toolSnippets.length > 0 && (
              <span className="drawer-section-count">{toolSnippets.length}</span>
            )}
          </div>
          <SnippetsSection
            snippets={toolSnippets}
            onAdd={(input) => snippets.addSnippet(tool.id, input)}
            onUpdate={snippets.updateSnippet}
            onRemove={snippets.removeSnippet}
          />
        </div>

        <div className="drawer-section">
          <div className="drawer-section-title">
            Notes
            {toolNotes.length > 0 && (
              <span className="drawer-section-count">{toolNotes.length}</span>
            )}
          </div>
          <NotesSection
            notes={toolNotes}
            onAdd={(text) => notes.addNote(text, { kind: "tool", toolId: tool.id })}
            onUpdate={notes.updateNote}
            onRemove={notes.removeNote}
            placeholder={`Anything worth remembering about ${tool.name}…`}
          />
        </div>

        {/* Removed the static "Recent" section that always rendered
            "No activity surfaced yet" — its data source (ACTIVITY in
            data/tools.ts) is intentionally an empty array, and the per-
            tool insights panels above (GitHubInsights, VercelInsights,
            etc.) already show real recent activity from live tokens. */}

        <div className="drawer-section">
          <div className="drawer-section-title">Pairs well with</div>
          <div className="pairs">
            {pairs.map((t) => (
              <div key={t.id} className="pair">
                <ToolLogo tool={t} size={22} />
                <span>{t.name}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
