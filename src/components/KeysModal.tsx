import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../lib/icons";
import type { VaultState } from "../hooks/useVault";
import type { SecretEntry, SecretsMap, Tool } from "../types";
import { ToolLogo } from "./ToolLogo";

type Filter = "with-keys" | "stack" | "all";

interface Props {
  tools: Tool[];
  secrets: SecretsMap;
  stack: string[];
  upsertKey: (toolId: string, entry: Omit<SecretEntry, "id"> & { id?: string }) => void;
  removeKey: (toolId: string, keyId: string) => void;
  onClose: () => void;
  // When set, the modal opens with All-tools filter and scrolls + auto-opens
  // the add-key form for that tool. Used by the "+ Add key" button in the
  // tool drawer.
  focusToolId?: string;
  // Vault state — when locked we render an unlock prompt instead.
  vaultState: VaultState;
  onUnlock: (passphrase: string) => Promise<void>;
}

export function KeysModal({
  tools, secrets, stack, upsertKey, removeKey, onClose, focusToolId,
  vaultState, onUnlock,
}: Props) {
  const [filter, setFilter] = useState<Filter>(focusToolId ? "all" : "with-keys");
  const [query, setQuery] = useState("");
  const focusedRef = useRef<HTMLLIElement>(null);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Scroll the focused tool's block into view after the next paint.
  useEffect(() => {
    if (!focusToolId) return;
    const id = window.requestAnimationFrame(() => {
      focusedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(id);
  }, [focusToolId]);

  const visibleTools = useMemo(() => {
    let pool: Tool[];
    if (filter === "with-keys") {
      pool = tools.filter((t) => (secrets[t.id]?.length ?? 0) > 0);
    } else if (filter === "stack") {
      pool = stack
        .map((id) => tools.find((t) => t.id === id))
        .filter((t): t is Tool => Boolean(t));
    } else {
      pool = tools;
    }
    const q = query.trim().toLowerCase();
    if (!q) return pool;
    return pool.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (secrets[t.id] ?? []).some((k) => k.label.toLowerCase().includes(q)),
    );
  }, [filter, query, secrets, stack, tools]);

  const totalKeys = useMemo(
    () => Object.values(secrets).reduce((sum, list) => sum + list.length, 0),
    [secrets],
  );

  if (vaultState === "locked") {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="keys-modal" onClick={(e) => e.stopPropagation()}>
          <header className="compare-head">
            <h2>
              <Icon.key /> Vault locked
            </h2>
            <button type="button" className="drawer-x" onClick={onClose}>
              <Icon.close />
            </button>
          </header>
          <UnlockForm onUnlock={onUnlock} />
        </div>
      </div>
    );
  }

  const toolsWithKeys = Object.keys(secrets).filter((id) => (secrets[id]?.length ?? 0) > 0).length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="keys-modal" onClick={(e) => e.stopPropagation()}>
        <header className="keys-head">
          <div className="keys-head-title">
            <Icon.key />
            <h2>API keys</h2>
            <span className="keys-head-meta">
              {totalKeys === 0
                ? "vault empty"
                : `${totalKeys} ${totalKeys === 1 ? "key" : "keys"} · ${toolsWithKeys} ${toolsWithKeys === 1 ? "tool" : "tools"}`}
            </span>
            <span
              className="keys-head-security"
              title="Keys live in your browser's localStorage. Anyone with access to this device can read them. Set a master passphrase in Settings → Security to encrypt at rest."
            >
              <span className="keys-head-security-dot" aria-hidden="true" />
              local only
            </span>
          </div>
          <button type="button" className="drawer-x keys-close" onClick={onClose} aria-label="Close">
            <Icon.close />
          </button>
        </header>

        <div className="keys-toolbar">
          <div className="searchbox keys-search">
            <Icon.search />
            <input
              type="text"
              placeholder="Filter by tool or key label…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="seg keys-seg">
            <button type="button" className={filter === "with-keys" ? "on" : ""} onClick={() => setFilter("with-keys")}>
              With keys
            </button>
            <button type="button" className={filter === "stack" ? "on" : ""} onClick={() => setFilter("stack")}>
              My stack
            </button>
            <button type="button" className={filter === "all" ? "on" : ""} onClick={() => setFilter("all")}>
              All tools
            </button>
          </div>
        </div>

        <div className="keys-body">
          {visibleTools.length === 0 ? (
            <div className="keys-empty">
              <div className="empty-big">No tools yet.</div>
              <div className="muted">
                Switch to &ldquo;All tools&rdquo; and click <em>Add key</em> on the tool you need.
              </div>
            </div>
          ) : (
            <ul className="keys-tool-list">
              {visibleTools.map((tool) => (
                <KeyToolBlock
                  key={tool.id}
                  tool={tool}
                  entries={secrets[tool.id] ?? []}
                  upsertKey={upsertKey}
                  removeKey={removeKey}
                  ref={tool.id === focusToolId ? focusedRef : undefined}
                  startAdding={tool.id === focusToolId && (secrets[tool.id]?.length ?? 0) === 0}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// Worst-case expiry tone across a tool's keys — drives the per-tool
// status dot (green: all healthy or no expiry set, amber: any expiring
// in <=14d, red: any expired). Empty entries → null (no dot rendered).
function worstExpiryTone(entries: SecretEntry[]): "ok" | "warn" | "danger" | null {
  if (entries.length === 0) return null;
  // Start ok; promote to warn on any 8-14 day expiry; short-circuit
  // return danger on any <=7d / expired (no need to check further).
  let worst: "ok" | "warn" = "ok";
  const now = Date.now();
  for (const e of entries) {
    if (typeof e.expiresAt !== "number") continue;
    const days = Math.round((e.expiresAt - now) / ONE_DAY);
    if (days < 0 || days <= 7) return "danger";
    if (days <= 14) worst = "warn";
  }
  return worst;
}

interface BlockProps {
  tool: Tool;
  entries: SecretEntry[];
  upsertKey: Props["upsertKey"];
  removeKey: Props["removeKey"];
  startAdding?: boolean;
}

const KeyToolBlock = forwardRef<HTMLLIElement, BlockProps>(function KeyToolBlock(
  { tool, entries, upsertKey, removeKey, startAdding },
  ref,
) {
  const [adding, setAdding] = useState(startAdding ?? false);
  // Per-tool status dot at-a-glance: green when healthy, amber for any
  // key expiring within 14 days, red for expired or expiring this week.
  const tone = worstExpiryTone(entries);
  const empty = entries.length === 0;

  return (
    <li className={`keys-tool${empty ? " is-empty" : ""}`} ref={ref}>
      <div className="keys-tool-head">
        <ToolLogo tool={tool} size={26} />
        <div className="keys-tool-meta">
          <div className="keys-tool-name">
            {tool.name}
            {tone && (
              <span
                className={`keys-tool-dot tone-${tone}`}
                aria-hidden="true"
                title={
                  tone === "danger"
                    ? "A key is expired or expires this week"
                    : tone === "warn"
                      ? "A key expires within 14 days"
                      : "Keys healthy"
                }
              />
            )}
          </div>
          <div className="keys-tool-cat">{tool.category}</div>
        </div>
        {entries.length > 1 && (
          <span className="keys-tool-count">{entries.length} keys</span>
        )}
        {!adding && (
          <button
            type="button"
            className="keys-add-chip"
            onClick={() => setAdding(true)}
            title={empty ? `Add a key for ${tool.name}` : "Add another key"}
          >
            <Icon.plus />
            <span>{empty ? "Add key" : "Add"}</span>
          </button>
        )}
      </div>

      {entries.length > 0 && (
        <ul className="keys-entry-list">
          {entries.map((entry) => (
            <KeyEntryRow
              key={entry.id}
              entry={entry}
              onPatch={(patch) =>
                upsertKey(tool.id, { ...entry, ...patch })
              }
              onRemove={() => removeKey(tool.id, entry.id)}
            />
          ))}
        </ul>
      )}

      {tool.id === "github" && empty && !adding && (
        <div className="keys-tool-hint">
          Add a Personal Access Token to surface your repos and recent activity.{" "}
          <a
            href="https://github.com/settings/tokens"
            target="_blank"
            rel="noreferrer"
          >
            Create one →
          </a>
        </div>
      )}

      {adding && (
        <NewKeyRow
          onCancel={() => setAdding(false)}
          onSave={(label, value, expiresAt) => {
            upsertKey(tool.id, { label, value, expiresAt });
            setAdding(false);
          }}
        />
      )}
    </li>
  );
});

// ── expires-at helpers ─────────────────────────────────────────────
const ONE_DAY = 24 * 60 * 60 * 1000;

function toDateInput(ms?: number): string {
  if (!ms) return "";
  // YYYY-MM-DD in local time so the input doesn't drift by a day
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function fromDateInput(s: string): number | undefined {
  if (!s) return undefined;
  // Treat the input as end-of-day local time so "expires today" doesn't
  // immediately read as "expired" the moment you save.
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  const dt = new Date(y, m - 1, d, 23, 59, 59);
  return dt.getTime();
}
function formatExpiry(ms: number): { label: string; tone: "ok" | "warn" | "danger" } {
  const days = Math.round((ms - Date.now()) / ONE_DAY);
  const dateStr = new Date(ms).toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric",
  });
  if (days < 0) return { label: `Expired ${Math.abs(days)}d ago · ${dateStr}`, tone: "danger" };
  if (days === 0) return { label: `Expires today · ${dateStr}`, tone: "danger" };
  if (days <= 7) return { label: `Expires in ${days} ${days === 1 ? "day" : "days"} · ${dateStr}`, tone: "danger" };
  if (days <= 14) return { label: `Expires in ${days} days · ${dateStr}`, tone: "warn" };
  return { label: `Expires ${dateStr} (${days}d)`, tone: "ok" };
}

interface EntryRowProps {
  entry: SecretEntry;
  onPatch: (patch: Partial<Pick<SecretEntry, "label" | "value" | "expiresAt">>) => void;
  onRemove: () => void;
}

function KeyEntryRow({ entry, onPatch, onRemove }: EntryRowProps) {
  const [reveal, setReveal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editingExpiry, setEditingExpiry] = useState(false);
  const [draftExpiry, setDraftExpiry] = useState(toDateInput(entry.expiresAt));
  const copyTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(copyTimer.current), []);

  const onCopy = async () => {
    if (!entry.value) return;
    try {
      await navigator.clipboard.writeText(entry.value);
      setCopied(true);
      window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // clipboard blocked — silent fall-through; reveal toggle still lets the user copy manually.
    }
  };

  const saveExpiry = () => {
    onPatch({ expiresAt: fromDateInput(draftExpiry) });
    setEditingExpiry(false);
  };
  const clearExpiry = () => {
    setDraftExpiry("");
    onPatch({ expiresAt: undefined });
    setEditingExpiry(false);
  };

  const expiryInfo = entry.expiresAt ? formatExpiry(entry.expiresAt) : null;

  return (
    <li className="keys-entry-wrap">
      <div className="keys-entry">
        <input
          type="text"
          className="keys-input keys-label"
          placeholder="Label"
          value={entry.label}
          onChange={(e) => onPatch({ label: e.target.value })}
        />
        <input
          type={reveal ? "text" : "password"}
          className="keys-input keys-value"
          placeholder="Paste key…"
          value={entry.value}
          onChange={(e) => onPatch({ value: e.target.value })}
          autoComplete="off"
          spellCheck={false}
        />
        {/* Inline expiry chip — compact when set, hidden by default
            when not (only shows on hover / focus to keep the row clean). */}
        {expiryInfo && !editingExpiry && (
          <button
            type="button"
            className={`keys-expiry-chip tone-${expiryInfo.tone}`}
            onClick={() => setEditingExpiry(true)}
            title={`${expiryInfo.label} — click to edit`}
          >
            <span className="keys-expiry-chip-dot" aria-hidden="true" />
            <span>{expiryInfo.label.split(" · ")[0]}</span>
          </button>
        )}
        {!expiryInfo && !editingExpiry && (
          <button
            type="button"
            className="keys-expiry-chip is-add"
            onClick={() => setEditingExpiry(true)}
            title="Set expiry date"
          >
            <Icon.plus />
            <span>Expiry</span>
          </button>
        )}
        <button
          type="button"
          className="chip-btn"
          onClick={() => setReveal((s) => !s)}
          title={reveal ? "Hide" : "Reveal"}
          aria-label={reveal ? "Hide value" : "Reveal value"}
        >
          {reveal ? <Icon.eyeOff /> : <Icon.eye />}
        </button>
        <button
          type="button"
          className={`chip-btn ${copied ? "on" : ""}`}
          onClick={onCopy}
          title={copied ? "Copied" : "Copy"}
          disabled={!entry.value}
          aria-label="Copy value"
        >
          {copied ? <Icon.check /> : <Icon.copy />}
        </button>
        <button
          type="button"
          className="chip-btn keys-trash"
          onClick={onRemove}
          title="Delete key"
          aria-label="Delete key"
        >
          <Icon.trash />
        </button>
      </div>

      {/* Expiry editor — only renders when actively editing. Appears
          below the row as a sub-control rather than always taking a
          row of vertical space. */}
      {editingExpiry && (
        <div className="keys-expiry-edit-row">
          <span className="keys-expiry-edit-label">Expires</span>
          <input
            type="date"
            className="keys-input keys-expiry-input"
            value={draftExpiry}
            onChange={(e) => setDraftExpiry(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") saveExpiry();
              if (e.key === "Escape") setEditingExpiry(false);
            }}
          />
          <button type="button" className="primary-btn small" onClick={saveExpiry}>
            Save
          </button>
          <button type="button" className="ghost-btn small" onClick={() => setEditingExpiry(false)}>
            Cancel
          </button>
          {entry.expiresAt && (
            <button type="button" className="keys-expiry-clear" onClick={clearExpiry} title="Remove expiry date">
              Clear
            </button>
          )}
        </div>
      )}
    </li>
  );
}

interface NewKeyRowProps {
  onSave: (label: string, value: string, expiresAt?: number) => void;
  onCancel: () => void;
}

function NewKeyRow({ onSave, onCancel }: NewKeyRowProps) {
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [expires, setExpires] = useState("");
  const [reveal, setReveal] = useState(false);
  const labelRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    labelRef.current?.focus();
  }, []);

  const canSave = label.trim().length > 0 && value.length > 0;

  const submit = () => {
    if (!canSave) return;
    onSave(label.trim(), value, fromDateInput(expires));
  };

  return (
    <div className="keys-entry-wrap is-new">
      <div className="keys-entry keys-entry-new">
        <input
          ref={labelRef}
          type="text"
          className="keys-input keys-label"
          placeholder="Label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && canSave) submit();
            if (e.key === "Escape") onCancel();
          }}
        />
        <input
          type={reveal ? "text" : "password"}
          className="keys-input keys-value"
          placeholder="Paste key…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && canSave) submit();
            if (e.key === "Escape") onCancel();
          }}
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="button"
          className="chip-btn"
          onClick={() => setReveal((s) => !s)}
          title={reveal ? "Hide" : "Reveal"}
          aria-label={reveal ? "Hide value" : "Reveal value"}
        >
          {reveal ? <Icon.eyeOff /> : <Icon.eye />}
        </button>
        <button type="button" className="primary-btn small" disabled={!canSave} onClick={submit}>
          Save
        </button>
        <button type="button" className="ghost-btn small" onClick={onCancel}>
          Cancel
        </button>
      </div>

      {/* Optional expiry — sub-control under the new-key row. */}
      <div className="keys-expiry-edit-row">
        <span className="keys-expiry-edit-label">
          Expires <span className="muted">(optional)</span>
        </span>
        <input
          type="date"
          className="keys-input keys-expiry-input"
          value={expires}
          onChange={(e) => setExpires(e.target.value)}
        />
      </div>
    </div>
  );
}

interface UnlockFormProps {
  onUnlock: (passphrase: string) => Promise<void>;
}

function UnlockForm({ onUnlock }: UnlockFormProps) {
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = async () => {
    if (!passphrase) return;
    setBusy(true);
    setError(null);
    try {
      await onUnlock(passphrase);
    } catch {
      setError("Wrong passphrase. Try again.");
      setPassphrase("");
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="unlock-form">
      <p className="muted unlock-blurb">
        Your API keys are encrypted with a master passphrase. Enter it to view or edit them.
      </p>
      <input
        ref={inputRef}
        type="password"
        className="keys-input"
        placeholder="Master passphrase"
        value={passphrase}
        onChange={(e) => setPassphrase(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !busy) submit();
        }}
        disabled={busy}
        autoComplete="current-password"
      />
      {error && <div className="unlock-error">{error}</div>}
      <button
        type="button"
        className="primary-btn"
        onClick={submit}
        disabled={busy || !passphrase}
      >
        {busy ? "Unlocking…" : "Unlock vault"}
      </button>
    </div>
  );
}
