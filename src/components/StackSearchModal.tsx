// StackSearchModal — single search input that fans out to GitHub, Vercel,
// and Linear in parallel using the user's stored tokens. Results stream in
// per-provider as they settle so the modal stays responsive even if one
// provider is slow. Cmd-Enter on a hit opens its native dashboard.

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../lib/icons";
import {
  makeGitHubProvider,
  makeLinearProvider,
  makeNotesProvider,
  makeVercelProvider,
  runSearch,
  type ProviderResult,
  type SearchHit,
  type SearchProvider,
} from "../lib/stackSearch";
import { timeAgo } from "../lib/timeAgo";
import type { SecretsMap, Tool } from "../types";
import { ToolLogo } from "./ToolLogo";

interface Props {
  allTools: Tool[];
  secrets: SecretsMap;
  onClose: () => void;
}

export function StackSearchModal({ allTools, secrets, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProviderResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);

  // Resolve stored token for each tool. First entry's value wins.
  const tokens = useMemo(() => {
    const get = (id: string): string | null => {
      const list = secrets[id];
      const t = list?.find((k) => k.value)?.value;
      return t || null;
    };
    return {
      github: get("github"),
      vercel: get("vercel"),
      linear: get("linear"),
    };
  }, [secrets]);

  // Map of toolId → accountUrl, fed to the notes provider so a note hit
  // can deep-link to its parent tool's actual dashboard.
  const accountUrls = useMemo(() => {
    const m: Record<string, string> = {};
    for (const t of allTools) m[t.id] = t.accountUrl;
    return m;
  }, [allTools]);

  const providers = useMemo<SearchProvider[]>(
    () => [
      makeGitHubProvider(tokens.github),
      makeVercelProvider(tokens.vercel),
      makeLinearProvider(tokens.linear),
      // Local-only — always enabled (no token required).
      makeNotesProvider(accountUrls),
    ],
    [tokens, accountUrls],
  );

  // Auto-focus the input on open.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Esc / overlay click → close (overlay handled in JSX). Esc here so it
  // works even when input is focused.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Debounced search. Cancel previous fetches on every keystroke.
  useEffect(() => {
    if (abortRef.current) abortRef.current.abort();
    if (debounceRef.current != null) window.clearTimeout(debounceRef.current);

    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    debounceRef.current = window.setTimeout(() => {
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setIsSearching(true);
      // Seed with empty per-provider entries so the UI shows pending dots.
      setResults(
        providers.map((p) => ({ toolId: p.toolId, status: "ok" as const, hits: [] })),
      );
      runSearch({
        query: q,
        providers,
        signal: ctrl.signal,
        onProviderSettled: (r) => {
          if (ctrl.signal.aborted) return;
          setResults((prev) => {
            const next = [...prev];
            const idx = next.findIndex((x) => x.toolId === r.toolId);
            if (idx >= 0) next[idx] = r;
            else next.push(r);
            return next;
          });
        },
      }).finally(() => {
        if (!ctrl.signal.aborted) setIsSearching(false);
      });
    }, 220);

    return () => {
      if (debounceRef.current != null) window.clearTimeout(debounceRef.current);
    };
  }, [query, providers]);

  // Flatten all hits across providers, sorted by recency. Results coming in
  // may be partial; that's fine, this is just the current snapshot.
  const flat = useMemo(() => {
    const all: SearchHit[] = [];
    for (const r of results) for (const h of r.hits) all.push(h);
    all.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
    return all;
  }, [results]);

  // Reset cursor when results change.
  useEffect(() => {
    setActiveIndex(0);
  }, [flat.length]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(flat.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" && flat[activeIndex]) {
      e.preventDefault();
      window.open(flat[activeIndex]!.url, "_blank", "noopener,noreferrer");
    }
  };

  // Resolve toolId → Tool, for logos in the result rows.
  const toolById = useMemo(() => {
    const m = new Map<string, Tool>();
    for (const t of allTools) m.set(t.id, t);
    return m;
  }, [allTools]);

  const enabledProviders = providers.filter((p) => {
    // Notes are local-only, always enabled regardless of tokens.
    if (p.toolId === "notes") return true;
    const tok = tokens[p.toolId as keyof typeof tokens];
    return Boolean(tok);
  });
  const noTokens = enabledProviders.length === 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="stack-search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="stack-search-input-wrap">
          <Icon.search />
          <input
            ref={inputRef}
            type="text"
            className="stack-search-input"
            placeholder="Search across GitHub · Vercel · Linear…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="stack-search-esc">esc</kbd>
        </div>

        <div className="stack-search-meta">
          <ProviderBadges results={results} enabled={enabledProviders} isSearching={isSearching} />
        </div>

        <div className="stack-search-body">
          {noTokens && (
            <div className="stack-search-empty">
              <div className="empty-big">No tokens stored</div>
              <p className="muted">
                Add a token for GitHub, Vercel, or Linear in the Keys vault and stack-wide search
                lights up. Each provider is queried directly from the browser using its token.
              </p>
            </div>
          )}

          {!noTokens && query.trim().length < 2 && (
            <div className="stack-search-empty">
              <div className="empty-big">Type to search</div>
              <p className="muted">
                One query, every connected tool. Try a Linear identifier, a commit message, a repo
                name, an issue title…
              </p>
            </div>
          )}

          {!noTokens && query.trim().length >= 2 && flat.length === 0 && !isSearching && (
            <div className="stack-search-empty">
              <div className="empty-big">No matches</div>
              <p className="muted">Nothing found across {enabledProviders.length} connected tools.</p>
            </div>
          )}

          {flat.length > 0 && (
            <ul className="stack-search-results">
              {flat.map((hit, idx) => {
                const tool = toolById.get(hit.toolId);
                return (
                  <li
                    key={`${hit.toolId}-${hit.url}-${idx}`}
                    className={`stack-search-hit ${idx === activeIndex ? "is-active" : ""}`}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => window.open(hit.url, "_blank", "noopener,noreferrer")}
                  >
                    {tool && <ToolLogo tool={tool} size={28} />}
                    <div className="stack-search-hit-body">
                      <div className="stack-search-hit-title">{hit.title}</div>
                      <div className="stack-search-hit-sub">
                        <span className="stack-search-hit-type">{hit.type}</span>
                        {hit.subtitle && <span> · {hit.subtitle}</span>}
                        {hit.timestamp && <span> · {timeAgo(hit.timestamp)}</span>}
                      </div>
                    </div>
                    <Icon.arrow />
                  </li>
                );
              })}
            </ul>
          )}

          {/* Per-provider error footers — non-fatal. */}
          {results
            .filter((r) => r.status === "error")
            .map((r) => (
              <div key={r.toolId} className="stack-search-error">
                {r.toolId}: {r.error}
              </div>
            ))}
        </div>

        <footer className="stack-search-foot">
          <span><kbd>↑</kbd> <kbd>↓</kbd> navigate</span>
          <span><kbd>↵</kbd> open</span>
          <span><kbd>esc</kbd> close</span>
        </footer>
      </div>
    </div>
  );
}

interface BadgesProps {
  results: ProviderResult[];
  enabled: SearchProvider[];
  isSearching: boolean;
}

function ProviderBadges({ results, enabled, isSearching }: BadgesProps) {
  if (enabled.length === 0) return null;
  return (
    <div className="stack-search-badges">
      {enabled.map((p) => {
        const r = results.find((x) => x.toolId === p.toolId);
        const dot = !r
          ? "idle"
          : isSearching && r.hits.length === 0 && r.status === "ok"
            ? "pending"
            : r.status === "error"
              ? "error"
              : r.hits.length > 0
                ? "ok"
                : "empty";
        return (
          <span key={p.toolId} className={`stack-search-badge dot-${dot}`}>
            {p.toolId}
            {r && r.status === "ok" && r.hits.length > 0 && (
              <span className="stack-search-badge-count">{r.hits.length}</span>
            )}
          </span>
        );
      })}
    </div>
  );
}
