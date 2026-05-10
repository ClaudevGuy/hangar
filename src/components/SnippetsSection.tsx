// Per-tool snippets list + inline add/edit. Mirrors NotesSection's
// pattern but the row carries an extra "language" hint chip and the
// content is rendered as preformatted code so newlines + indentation
// survive. One-click copy button per snippet.
//
// State is local to each row's edit toggle; persistence + cross-tool
// access lives in the useSnippets hook (the parent is responsible
// for filtering by toolId).

import { useEffect, useRef, useState } from "react";
import type { Snippet, SnippetInput } from "../hooks/useSnippets";
import { Icon } from "../lib/icons";

interface Props {
  snippets: Snippet[];
  onAdd: (input: SnippetInput) => Snippet;
  onUpdate: (id: string, patch: Partial<SnippetInput>) => void;
  onRemove: (id: string) => void;
}

export function SnippetsSection({ snippets, onAdd, onUpdate, onRemove }: Props) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="snippets-section">
      {snippets.length === 0 && !adding && (
        <p className="snippets-empty muted">
          Stash curl commands, deploy scripts, SQL fragments — anything you
          look up more than once. One-click copy when you need it.
        </p>
      )}

      {snippets.length > 0 && (
        <ul className="snippets-list">
          {snippets.map((snippet) =>
            editingId === snippet.id ? (
              <li key={snippet.id} className="snippet-row is-editing">
                <SnippetForm
                  initial={snippet}
                  onSave={(patch) => {
                    onUpdate(snippet.id, patch);
                    setEditingId(null);
                  }}
                  onCancel={() => setEditingId(null)}
                  saveLabel="Save"
                />
              </li>
            ) : (
              <SnippetRow
                key={snippet.id}
                snippet={snippet}
                onEdit={() => setEditingId(snippet.id)}
                onRemove={() => onRemove(snippet.id)}
              />
            ),
          )}
        </ul>
      )}

      {adding ? (
        <div className="snippet-row is-editing">
          <SnippetForm
            initial={null}
            onSave={(input) => {
              if (!input.title.trim() || !input.content.trim()) return;
              onAdd(input);
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
            saveLabel="Add snippet"
          />
        </div>
      ) : (
        <button
          type="button"
          className="snippets-add-btn"
          onClick={() => setAdding(true)}
        >
          <Icon.plus /> Add snippet
        </button>
      )}
    </div>
  );
}

interface SnippetRowProps {
  snippet: Snippet;
  onEdit: () => void;
  onRemove: () => void;
}

function SnippetRow({ snippet, onEdit, onRemove }: SnippetRowProps) {
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(copyTimer.current), []);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet.content);
      setCopied(true);
      window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked — silent. The Edit affordance still lets the
      // user select + copy manually.
    }
  };

  return (
    <li className="snippet-row">
      <div className="snippet-head">
        <span className="snippet-title">{snippet.title}</span>
        {snippet.lang && <span className="snippet-lang">{snippet.lang}</span>}
        <div className="snippet-actions">
          <button
            type="button"
            className={`chip-btn ${copied ? "on" : ""}`}
            onClick={onCopy}
            title={copied ? "Copied" : "Copy snippet"}
            aria-label="Copy snippet"
          >
            {copied ? <Icon.check /> : <Icon.copy />}
          </button>
          <button
            type="button"
            className="chip-btn"
            onClick={onEdit}
            title="Edit snippet"
            aria-label="Edit snippet"
          >
            <span className="snippet-edit-glyph" aria-hidden>
              ✎
            </span>
          </button>
          <button
            type="button"
            className="chip-btn snippet-trash"
            onClick={onRemove}
            title="Delete snippet"
            aria-label="Delete snippet"
          >
            <Icon.trash />
          </button>
        </div>
      </div>
      <pre className="snippet-content">
        <code>{snippet.content}</code>
      </pre>
    </li>
  );
}

interface SnippetFormProps {
  initial: Snippet | null;
  onSave: (input: SnippetInput) => void;
  onCancel: () => void;
  saveLabel: string;
}

function SnippetForm({ initial, onSave, onCancel, saveLabel }: SnippetFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [lang, setLang] = useState(initial?.lang ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  const canSave = title.trim().length > 0 && content.trim().length > 0;
  const submit = () => {
    if (!canSave) return;
    onSave({ title: title.trim(), lang: lang.trim() || undefined, content });
  };

  return (
    <div className="snippet-form">
      <div className="snippet-form-meta">
        <input
          ref={titleRef}
          type="text"
          className="snippet-input snippet-input-title"
          placeholder="Title (e.g. 'curl webhook test')"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") onCancel();
          }}
        />
        <input
          type="text"
          className="snippet-input snippet-input-lang"
          placeholder="bash · sql · ts…"
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          maxLength={16}
        />
      </div>
      <textarea
        className="snippet-input snippet-input-content"
        placeholder="Paste the snippet…"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={5}
        spellCheck={false}
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel();
          // ⌘/Ctrl + Enter saves — saves Tab for indenting inside the
          // textarea.
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            submit();
          }
        }}
      />
      <div className="snippet-form-actions">
        <button type="button" className="ghost-btn small" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className="primary-btn small"
          disabled={!canSave}
          onClick={submit}
        >
          {saveLabel}
        </button>
      </div>
    </div>
  );
}
