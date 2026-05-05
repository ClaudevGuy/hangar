import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../lib/icons";
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
}

export function KeysModal({
  tools, secrets, stack, upsertKey, removeKey, onClose, focusToolId,
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="keys-modal" onClick={(e) => e.stopPropagation()}>
        <header className="compare-head">
          <h2>
            API keys{" "}
            <span className="muted">
              ·{" "}
              {totalKeys === 0
                ? "vault empty"
                : `${totalKeys} ${totalKeys === 1 ? "key" : "keys"} across ${Object.keys(secrets).length} ${Object.keys(secrets).length === 1 ? "tool" : "tools"}`}
            </span>
          </h2>
          <button type="button" className="drawer-x" onClick={onClose}>
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

        <div className="keys-banner">
          <span>
            Stored locally in your browser only. Anyone with access to this device can read them —
            keep production secrets elsewhere.
          </span>
        </div>

        <div className="keys-body">
          {visibleTools.length === 0 ? (
            <div className="keys-empty">
              <div className="empty-big">No tools yet.</div>
              <div className="muted">
                Switch to “All tools” and click <em>Add a key</em> on the tool you need.
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

  return (
    <li className="keys-tool" ref={ref}>
      <div className="keys-tool-head">
        <ToolLogo tool={tool} size={32} />
        <div className="keys-tool-meta">
          <div className="keys-tool-name">{tool.name}</div>
          <div className="keys-tool-cat">{tool.category}</div>
        </div>
        <span className="keys-tool-count">
          {entries.length} {entries.length === 1 ? "key" : "keys"}
        </span>
      </div>

      {entries.length > 0 && (
        <ul className="keys-entry-list">
          {entries.map((entry) => (
            <KeyEntryRow
              key={entry.id}
              entry={entry}
              onChange={(label, value) => upsertKey(tool.id, { id: entry.id, label, value })}
              onRemove={() => removeKey(tool.id, entry.id)}
            />
          ))}
        </ul>
      )}

      {adding ? (
        <NewKeyRow
          onCancel={() => setAdding(false)}
          onSave={(label, value) => {
            upsertKey(tool.id, { label, value });
            setAdding(false);
          }}
        />
      ) : (
        <button type="button" className="keys-add-btn" onClick={() => setAdding(true)}>
          <Icon.plus /> Add a key
        </button>
      )}
    </li>
  );
});

interface EntryRowProps {
  entry: SecretEntry;
  onChange: (label: string, value: string) => void;
  onRemove: () => void;
}

function KeyEntryRow({ entry, onChange, onRemove }: EntryRowProps) {
  const [reveal, setReveal] = useState(false);
  const [copied, setCopied] = useState(false);
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

  return (
    <li className="keys-entry">
      <input
        type="text"
        className="keys-input keys-label"
        placeholder="Label (e.g. Personal Access Token)"
        value={entry.label}
        onChange={(e) => onChange(e.target.value, entry.value)}
      />
      <input
        type={reveal ? "text" : "password"}
        className="keys-input keys-value"
        placeholder="Paste key…"
        value={entry.value}
        onChange={(e) => onChange(entry.label, e.target.value)}
        autoComplete="off"
        spellCheck={false}
      />
      <button
        type="button"
        className="chip-btn"
        onClick={() => setReveal((s) => !s)}
        title={reveal ? "Hide" : "Reveal"}
      >
        {reveal ? <Icon.eyeOff /> : <Icon.eye />}
      </button>
      <button
        type="button"
        className={`chip-btn ${copied ? "on" : ""}`}
        onClick={onCopy}
        title={copied ? "Copied" : "Copy"}
        disabled={!entry.value}
      >
        {copied ? <Icon.check /> : <Icon.copy />}
      </button>
      <button type="button" className="chip-btn keys-trash" onClick={onRemove} title="Delete key">
        <Icon.trash />
      </button>
    </li>
  );
}

interface NewKeyRowProps {
  onSave: (label: string, value: string) => void;
  onCancel: () => void;
}

function NewKeyRow({ onSave, onCancel }: NewKeyRowProps) {
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [reveal, setReveal] = useState(false);
  const labelRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    labelRef.current?.focus();
  }, []);

  const canSave = label.trim().length > 0 && value.length > 0;

  return (
    <div className="keys-entry keys-entry-new">
      <input
        ref={labelRef}
        type="text"
        className="keys-input keys-label"
        placeholder="Label (e.g. API key)"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && canSave) onSave(label.trim(), value);
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
          if (e.key === "Enter" && canSave) onSave(label.trim(), value);
          if (e.key === "Escape") onCancel();
        }}
        autoComplete="off"
        spellCheck={false}
      />
      <button type="button" className="chip-btn" onClick={() => setReveal((s) => !s)} title={reveal ? "Hide" : "Reveal"}>
        {reveal ? <Icon.eyeOff /> : <Icon.eye />}
      </button>
      <button type="button" className="primary-btn small" disabled={!canSave} onClick={() => onSave(label.trim(), value)}>
        Save
      </button>
      <button type="button" className="ghost-btn small" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}
