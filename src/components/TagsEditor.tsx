// Compact chip-list + input for managing per-tool tags. Used inside the
// ToolDrawer's "Tags" section. Each existing tag is a removable chip;
// pressing Enter or comma in the input commits a new tag (normalised by
// useToolTags). Supports basic keyboard ergonomics — Backspace on an
// empty input removes the last tag (Slack/Linear pattern).

import { useRef, useState, type KeyboardEvent } from "react";
import { Icon } from "../lib/icons";

interface Props {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  // Suggestions to render below the input as quick-add chips. Caller
  // typically passes the workspace's most-used tags so users can build
  // up a small consistent vocabulary instead of typing fresh strings.
  suggestions?: string[];
}

export function TagsEditor({ tags, onAdd, onRemove, suggestions = [] }: Props) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = () => {
    const value = draft.trim();
    if (!value) return;
    onAdd(value);
    setDraft("");
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && draft === "" && tags.length > 0) {
      // Empty input + Backspace removes the last tag — same affordance
      // Slack, Linear, GitHub all use for chip-style inputs.
      e.preventDefault();
      onRemove(tags[tags.length - 1]);
    }
  };

  // Suggestions the user doesn't already have on this tool. Capped to
  // 6 so the row stays compact.
  const filteredSuggestions = suggestions
    .filter((s) => !tags.includes(s))
    .slice(0, 6);

  return (
    <div className="tags-editor">
      <div className="tags-input-row" onClick={() => inputRef.current?.focus()}>
        {tags.map((tag) => (
          <span key={tag} className="tag-chip">
            <span>{tag}</span>
            <button
              type="button"
              className="tag-chip-x"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(tag);
              }}
              title={`Remove "${tag}"`}
              aria-label={`Remove tag ${tag}`}
            >
              <Icon.close />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          className="tag-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          onBlur={commit}
          placeholder={tags.length === 0 ? "Add a tag…" : ""}
          autoComplete="off"
          spellCheck={false}
        />
      </div>
      {filteredSuggestions.length > 0 && (
        <div className="tags-suggestions">
          <span className="tags-suggestions-label">Quick add</span>
          {filteredSuggestions.map((tag) => (
            <button
              key={tag}
              type="button"
              className="tag-suggestion"
              onClick={() => onAdd(tag)}
              title={`Add "${tag}"`}
            >
              + {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
