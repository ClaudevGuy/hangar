// Reusable notes UI — list + inline editor + "Add note" affordance.
// Used in two places today: the ToolDrawer (scope: tool) and inline
// inside the Today panel's expanded incident view (scope: incident).
//
// State is local: the parent owns the persistence (via useNotes), this
// component just renders + dispatches events.

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Icon } from "../lib/icons";
import { timeAgo } from "../lib/timeAgo";
import type { Note } from "../hooks/useNotes";

interface Props {
  notes: Note[];
  onAdd: (text: string) => void;
  onUpdate: (id: string, text: string) => void;
  onRemove: (id: string) => void;
  placeholder?: string;
  // Tighter spacing + smaller default copy for inline incident usage.
  compact?: boolean;
  // If true (default), shows the "Add note" button. Set to false to
  // start in the add state — useful when the parent toggles the
  // section open via its own affordance.
  startInAdd?: boolean;
}

export function NotesSection({
  notes,
  onAdd,
  onUpdate,
  onRemove,
  placeholder,
  compact,
  startInAdd,
}: Props) {
  const [adding, setAdding] = useState(!!startInAdd && notes.length === 0);
  const [draftText, setDraftText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const draftRef = useRef<HTMLTextAreaElement>(null);
  const editRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus the textarea when opened.
  useEffect(() => {
    if (adding) draftRef.current?.focus();
  }, [adding]);
  useEffect(() => {
    if (editingId) editRef.current?.focus();
  }, [editingId]);

  const startAdd = () => {
    setAdding(true);
    setDraftText("");
  };
  const cancelAdd = () => {
    setAdding(false);
    setDraftText("");
  };
  const saveAdd = () => {
    const trimmed = draftText.trim();
    if (!trimmed) {
      cancelAdd();
      return;
    }
    onAdd(trimmed);
    cancelAdd();
  };

  const startEdit = (n: Note) => {
    setEditingId(n.id);
    setEditText(n.text);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };
  const saveEdit = () => {
    if (!editingId) return;
    const trimmed = editText.trim();
    if (!trimmed) {
      cancelEdit();
      return;
    }
    onUpdate(editingId, trimmed);
    cancelEdit();
  };

  const onTextareaKey = (
    e: KeyboardEvent<HTMLTextAreaElement>,
    onSave: () => void,
    onCancel: () => void,
  ) => {
    // ⌘/Ctrl+Enter saves; Escape cancels. Plain Enter inserts a newline.
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      onSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div className={`notes-section${compact ? " is-compact" : ""}`}>
      {notes.length === 0 && !adding && (
        <p className="notes-empty muted">
          {placeholder ?? "No notes yet. Drop a thought, a quirk, a fix worth remembering."}
        </p>
      )}

      {notes.length > 0 && (
        <ul className="notes-list">
          {notes.map((n) =>
            editingId === n.id ? (
              <li key={n.id} className="note-card is-editing">
                <textarea
                  ref={editRef}
                  className="note-textarea"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => onTextareaKey(e, saveEdit, cancelEdit)}
                  rows={3}
                />
                <div className="note-card-actions">
                  <span className="note-hint">⌘↵ save · esc cancel</span>
                  <button type="button" className="ghost-btn small" onClick={cancelEdit}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="primary-btn small"
                    onClick={saveEdit}
                    disabled={!editText.trim()}
                  >
                    Save
                  </button>
                </div>
              </li>
            ) : (
              <li key={n.id} className="note-card">
                <p className="note-text">{n.text}</p>
                <div className="note-meta">
                  <span className="note-time">{timeAgo(n.updatedAt)}</span>
                  <div className="note-actions">
                    <button
                      type="button"
                      className="note-action"
                      onClick={() => startEdit(n)}
                      title="Edit note"
                      aria-label="Edit note"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="note-action note-action-danger"
                      onClick={() => onRemove(n.id)}
                      title="Delete note"
                      aria-label="Delete note"
                    >
                      <Icon.trash />
                    </button>
                  </div>
                </div>
              </li>
            ),
          )}
        </ul>
      )}

      {adding ? (
        <div className="note-card is-editing">
          <textarea
            ref={draftRef}
            className="note-textarea"
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            onKeyDown={(e) => onTextareaKey(e, saveAdd, cancelAdd)}
            placeholder={placeholder ?? "Note worth remembering…"}
            rows={3}
          />
          <div className="note-card-actions">
            <span className="note-hint">⌘↵ save · esc cancel</span>
            <button type="button" className="ghost-btn small" onClick={cancelAdd}>
              Cancel
            </button>
            <button
              type="button"
              className="primary-btn small"
              onClick={saveAdd}
              disabled={!draftText.trim()}
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="note-add-btn" onClick={startAdd}>
          <Icon.plus /> Add note
        </button>
      )}
    </div>
  );
}
