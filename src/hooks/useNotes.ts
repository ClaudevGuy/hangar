// Contextual notes — small text snippets attached to a Hangar entity (a
// pinned tool, a Today-feed incident, etc.). Workspace-scoped, persisted
// to localStorage. Designed to be the institutional-memory layer that
// only Hangar can pull off because it knows the surrounding stack.

import { useCallback, useEffect, useState } from "react";
import { workspaceKey } from "../lib/workspaces";

// What this note is attached to. Discriminated union so we can render
// different affordances + filter by scope efficiently.
export type NoteScope =
  | { kind: "tool"; toolId: string }
  | { kind: "incident"; incidentId: string };

export interface Note {
  id: string;
  text: string;
  scope: NoteScope;
  // unix-ms; we sort lists by `updatedAt` desc so most recently touched
  // notes float to the top of any view.
  createdAt: number;
  updatedAt: number;
}

const storageKey = () => workspaceKey("hangar-notes");

function newId(): string {
  return `n_${Math.random().toString(36).slice(2, 10)}`;
}

function read(): Note[] {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isNote);
  } catch {
    return [];
  }
}

function isNote(v: unknown): v is Note {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  if (typeof o.id !== "string" || typeof o.text !== "string") return false;
  if (typeof o.createdAt !== "number" || typeof o.updatedAt !== "number") return false;
  const scope = o.scope as Record<string, unknown> | null;
  if (!scope || typeof scope !== "object") return false;
  if (scope.kind === "tool" && typeof scope.toolId === "string") return true;
  if (scope.kind === "incident" && typeof scope.incidentId === "string") return true;
  return false;
}

function write(notes: Note[]): void {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(notes));
  } catch {
    // Quota / serialization failures: don't block the UI.
  }
}

// Custom event so multiple useNotes() instances in the tree stay in sync
// without forcing every consumer to be a prop-drilled child of one root.
const CHANGE_EVENT = "hangar-notes-changed";
function notifyChanged(): void {
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export interface UseNotesReturn {
  // All notes, sorted by updatedAt desc (most recent first).
  notes: Note[];
  // Selectors — small, no memoization; callers can wrap in useMemo if hot.
  notesForTool: (toolId: string) => Note[];
  notesForIncident: (incidentId: string) => Note[];
  searchNotes: (query: string) => Note[];
  // Mutations.
  addNote: (text: string, scope: NoteScope) => Note;
  updateNote: (id: string, text: string) => void;
  removeNote: (id: string) => void;
}

export function useNotes(): UseNotesReturn {
  const [notes, setNotes] = useState<Note[]>(() => read());

  // Persist whenever the list changes + notify peer instances.
  useEffect(() => {
    write(notes);
    notifyChanged();
  }, [notes]);

  // Stay in sync with peer instances (within the same tab via the custom
  // event; across tabs via the native storage event).
  useEffect(() => {
    const onChanged = () => setNotes(read());
    const onStorage = (e: StorageEvent) => {
      if (e.key === storageKey()) setNotes(read());
    };
    window.addEventListener(CHANGE_EVENT, onChanged);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChanged);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const notesForTool = useCallback(
    (toolId: string): Note[] =>
      notes
        .filter((n) => n.scope.kind === "tool" && n.scope.toolId === toolId)
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [notes],
  );

  const notesForIncident = useCallback(
    (incidentId: string): Note[] =>
      notes
        .filter((n) => n.scope.kind === "incident" && n.scope.incidentId === incidentId)
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [notes],
  );

  const searchNotes = useCallback(
    (query: string): Note[] => {
      const q = query.trim().toLowerCase();
      if (!q) return [];
      return notes
        .filter((n) => n.text.toLowerCase().includes(q))
        .sort((a, b) => b.updatedAt - a.updatedAt);
    },
    [notes],
  );

  const addNote = useCallback(
    (text: string, scope: NoteScope): Note => {
      const trimmed = text.trim();
      const now = Date.now();
      const note: Note = {
        id: newId(),
        text: trimmed,
        scope,
        createdAt: now,
        updatedAt: now,
      };
      setNotes((prev) => [note, ...prev]);
      return note;
    },
    [],
  );

  const updateNote = useCallback((id: string, text: string) => {
    const trimmed = text.trim();
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, text: trimmed, updatedAt: Date.now() } : n)),
    );
  }, []);

  const removeNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Stable sort for the public `notes` array — most recent first.
  const sorted = [...notes].sort((a, b) => b.updatedAt - a.updatedAt);

  return {
    notes: sorted,
    notesForTool,
    notesForIncident,
    searchNotes,
    addNote,
    updateNote,
    removeNote,
  };
}
