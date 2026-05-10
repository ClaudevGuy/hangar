// Per-tool snippets vault — curl commands, deploy scripts, oneliners,
// SQL fragments, anything the user wants quick access to without
// switching to their notes app. One blob in localStorage holds every
// snippet across every tool for the workspace; selectors slice by
// toolId at the React layer.
//
// Cross-instance + cross-tab sync via the same custom-event +
// StorageEvent pattern useNotes / useToolTags use.

import { useCallback, useEffect, useState } from "react";
import { workspaceKey } from "../lib/workspaces";

// Free-form language tag — used as a hint for the title chip and
// (eventually) syntax highlighting. Kept as `string` so users can
// type whatever they want; we only render it as a text chip today.
export type SnippetLang = string;

export interface Snippet {
  id: string;
  toolId: string;
  title: string;
  content: string;
  lang?: SnippetLang;
  // ms since epoch — sort newest first, most recently edited bubbles up.
  createdAt: number;
  updatedAt: number;
}

export interface SnippetInput {
  title: string;
  content: string;
  lang?: SnippetLang;
}

const CHANGE_EVENT = "hangar-snippets-changed";
const storageKey = () => workspaceKey("hangar-snippets");

function newId(): string {
  return `sn_${Math.random().toString(36).slice(2, 10)}`;
}

function isSnippet(v: unknown): v is Snippet {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.toolId === "string" &&
    typeof o.title === "string" &&
    typeof o.content === "string" &&
    typeof o.createdAt === "number" &&
    typeof o.updatedAt === "number"
  );
}

function read(): Snippet[] {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSnippet);
  } catch {
    return [];
  }
}

function write(snippets: Snippet[]): void {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(snippets));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  } catch {
    // quota / serialization — silent.
  }
}

export interface UseSnippetsReturn {
  snippets: Snippet[];
  snippetsFor: (toolId: string) => Snippet[];
  addSnippet: (toolId: string, input: SnippetInput) => Snippet;
  updateSnippet: (id: string, patch: Partial<SnippetInput>) => void;
  removeSnippet: (id: string) => void;
}

export function useSnippets(): UseSnippetsReturn {
  const [snippets, setSnippets] = useState<Snippet[]>(() => read());

  useEffect(() => {
    write(snippets);
  }, [snippets]);

  useEffect(() => {
    const onChanged = () => setSnippets(read());
    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key.startsWith("hangar-snippets-")) setSnippets(read());
    };
    window.addEventListener(CHANGE_EVENT, onChanged);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChanged);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const snippetsFor = useCallback(
    (toolId: string): Snippet[] =>
      snippets
        .filter((s) => s.toolId === toolId)
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [snippets],
  );

  const addSnippet = useCallback(
    (toolId: string, input: SnippetInput): Snippet => {
      const now = Date.now();
      const snippet: Snippet = {
        id: newId(),
        toolId,
        title: input.title.trim(),
        content: input.content,
        lang: input.lang?.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      };
      setSnippets((prev) => [snippet, ...prev]);
      return snippet;
    },
    [],
  );

  const updateSnippet = useCallback(
    (id: string, patch: Partial<SnippetInput>) => {
      setSnippets((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s;
          return {
            ...s,
            title: patch.title !== undefined ? patch.title.trim() : s.title,
            content: patch.content !== undefined ? patch.content : s.content,
            lang:
              patch.lang !== undefined
                ? patch.lang.trim() || undefined
                : s.lang,
            updatedAt: Date.now(),
          };
        }),
      );
    },
    [],
  );

  const removeSnippet = useCallback((id: string) => {
    setSnippets((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return { snippets, snippetsFor, addSnippet, updateSnippet, removeSnippet };
}
