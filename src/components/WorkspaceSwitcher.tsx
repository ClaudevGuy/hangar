import { useEffect, useRef, useState } from "react";
import {
  createWorkspace,
  getActiveWorkspaceId,
  listWorkspaces,
  removeWorkspace,
  renameWorkspace,
  setActiveWorkspaceId,
  type Workspace,
} from "../lib/workspaces";
import { Icon } from "../lib/icons";

const PRESET_EMOJIS = ["🏠", "💼", "🚀", "🧪", "🎨", "🌙", "📦", "🛠️", "💡"];

export function WorkspaceSwitcher() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => listWorkspaces());
  const activeId = getActiveWorkspaceId();
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState(PRESET_EMOJIS[1]);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const newNameRef = useRef<HTMLInputElement>(null);

  // Outside-click + Esc to close.
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

  useEffect(() => {
    if (adding) newNameRef.current?.focus();
  }, [adding]);

  const active = workspaces.find((w) => w.id === activeId) ?? workspaces[0];

  const switchTo = (id: string) => {
    if (id === activeId) {
      setOpen(false);
      return;
    }
    setActiveWorkspaceId(id);
    // Reload so every persistence hook re-reads from the new workspace's keys.
    window.location.reload();
  };

  const create = () => {
    const name = newName.trim();
    if (!name) return;
    const ws = createWorkspace(name, newEmoji);
    setWorkspaces(listWorkspaces());
    setNewName("");
    setAdding(false);
    setActiveWorkspaceId(ws.id);
    window.location.reload();
  };

  const finishRename = () => {
    if (!renamingId) return;
    const trimmed = renameValue.trim();
    if (trimmed) {
      renameWorkspace(renamingId, trimmed);
      setWorkspaces(listWorkspaces());
    }
    setRenamingId(null);
  };

  const remove = (id: string) => {
    if (workspaces.length <= 1) return;
    if (!window.confirm("Remove this workspace? Its stack, prefs, keys and custom tools will be deleted.")) {
      return;
    }
    removeWorkspace(id);
    if (id === activeId) {
      window.location.reload();
    } else {
      setWorkspaces(listWorkspaces());
    }
  };

  return (
    <div className="ws-wrap" ref={wrapRef}>
      <button
        type="button"
        className="ghost-btn ws-trigger"
        onClick={() => setOpen((s) => !s)}
        title="Switch workspace"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <span className="ws-emoji">{active?.emoji ?? "📁"}</span>
        <span className="ws-name">{active?.name ?? "Workspace"}</span>
        <span className="ws-caret">▾</span>
      </button>
      {open && (
        <div className="ws-menu" role="menu">
          <div className="settings-label">Workspaces</div>
          <ul className="ws-list">
            {workspaces.map((w) => (
              <li key={w.id} className={`ws-item ${w.id === activeId ? "active" : ""}`}>
                {renamingId === w.id ? (
                  <input
                    autoFocus
                    className="keys-input ws-rename"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={finishRename}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") finishRename();
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                  />
                ) : (
                  <>
                    <button
                      type="button"
                      className="ws-pick"
                      onClick={() => switchTo(w.id)}
                    >
                      <span className="ws-emoji">{w.emoji}</span>
                      <span className="ws-name">{w.name}</span>
                      {w.id === activeId && <Icon.check />}
                    </button>
                    <button
                      type="button"
                      className="chip-btn ws-rename-btn"
                      onClick={() => {
                        setRenamingId(w.id);
                        setRenameValue(w.name);
                      }}
                      title="Rename"
                    >
                      ✎
                    </button>
                    {workspaces.length > 1 && (
                      <button
                        type="button"
                        className="chip-btn ws-remove-btn"
                        onClick={() => remove(w.id)}
                        title="Remove"
                      >
                        <Icon.close />
                      </button>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
          {adding ? (
            <div className="ws-new">
              <div className="ws-emoji-row">
                {PRESET_EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    className={`ws-emoji-btn ${newEmoji === e ? "on" : ""}`}
                    onClick={() => setNewEmoji(e)}
                  >
                    {e}
                  </button>
                ))}
              </div>
              <input
                ref={newNameRef}
                className="keys-input"
                placeholder="Workspace name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") create();
                  if (e.key === "Escape") setAdding(false);
                }}
              />
              <div className="ws-new-actions">
                <button type="button" className="ghost-btn small" onClick={() => setAdding(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="primary-btn small"
                  onClick={create}
                  disabled={!newName.trim()}
                >
                  Create
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="ws-add" onClick={() => setAdding(true)}>
              <Icon.plus /> New workspace
            </button>
          )}
        </div>
      )}
    </div>
  );
}
