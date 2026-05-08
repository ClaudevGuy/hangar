// AskModal — "Ask your stack" premium chat surface. Centered modal,
// auto-resizing input, suggested prompts on empty, citations as
// clickable hit cards, per-session token + cost meter. History
// persists in workspace-scoped localStorage.

import { useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import type { ToolMetaMap } from "../hooks/useToolMeta";
import { Icon } from "../lib/icons";
import { estimateUsdCost, runAsk, type AskTurn } from "../lib/ask";
import { availableIntegrations } from "../lib/askTools";
import { timeAgo } from "../lib/timeAgo";
import { workspaceKey } from "../lib/workspaces";
import type { SecretsMap, Tool } from "../types";
import { ToolLogo } from "./ToolLogo";

interface Props {
  allTools: Tool[];
  stackTools: Tool[];
  toolMeta: ToolMetaMap;
  secrets: SecretsMap;
  onClose: () => void;
  onAddAnthropicKey: () => void;
}

const HISTORY_KEY = () => workspaceKey("hangar-ask-history");
const HISTORY_CAP = 30;

const SUGGESTED_PROMPTS: { label: string; prompt: string }[] = [
  {
    label: "What's broken right now?",
    prompt: "Check Sentry and Vercel — what's broken right now and what changed recently?",
  },
  {
    label: "What's on my plate?",
    prompt: "Show me my urgent Linear tickets and any GitHub PRs waiting on my review.",
  },
  {
    label: "How's the deploy looking?",
    prompt: "Summarise the last 5 production deploys on Vercel — anything failed or unusual?",
  },
  {
    label: "What does my stack cost?",
    prompt: "Read my stack and give me the monthly cost rollup, plus categories represented.",
  },
];

// ─────────────────────────────────────────────────────────────────────────
// Persistence
// ─────────────────────────────────────────────────────────────────────────

function loadHistory(): AskTurn[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY());
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AskTurn[];
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(-HISTORY_CAP);
  } catch {
    return [];
  }
}

function saveHistory(turns: AskTurn[]) {
  try {
    localStorage.setItem(HISTORY_KEY(), JSON.stringify(turns.slice(-HISTORY_CAP)));
  } catch {
    // Quota / serialization failures: don't block the UI.
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Markdown-lite — render **bold** and `inline code`. Anything else is text.
// ─────────────────────────────────────────────────────────────────────────

function renderInline(text: string): React.ReactNode[] {
  // Split on either **bold** or `code` tokens, keep delimiters.
  const parts: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) {
      parts.push(<strong key={i++}>{tok.slice(2, -2)}</strong>);
    } else {
      parts.push(<code key={i++}>{tok.slice(1, -1)}</code>);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function renderProse(text: string): React.ReactNode[] {
  return text.split("\n\n").map((para, i) => (
    <p key={i} className="ask-prose-p">
      {para.split("\n").flatMap((line, j, arr) =>
        j === arr.length - 1
          ? renderInline(line)
          : [...renderInline(line), <br key={`br-${j}`} />],
      )}
    </p>
  ));
}

// ─────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────

export function AskModal({
  allTools, stackTools, toolMeta, secrets, onClose, onAddAnthropicKey,
}: Props) {
  const anthropicKey = secrets["anthropic"]?.find((k) => k.value)?.value || null;
  const [turns, setTurns] = useState<AskTurn[]>(() => loadHistory());
  const [input, setInput] = useState("");
  const [running, setRunning] = useState(false);
  const [statusLine, setStatusLine] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const conversationRef = useRef<HTMLDivElement>(null);

  const ctx = useMemo(
    () => ({ stackTools, toolMeta, secrets }),
    [stackTools, toolMeta, secrets],
  );
  const integrations = useMemo(() => availableIntegrations(ctx), [ctx]);
  const toolById = useMemo(() => {
    const m = new Map<string, Tool>();
    for (const t of allTools) m.set(t.id, t);
    return m;
  }, [allTools]);

  // Cumulative usage across the visible turn list.
  const totalUsage = useMemo(() => {
    let inT = 0, outT = 0;
    for (const t of turns) {
      if (t.usage) {
        inT += t.usage.inputTokens;
        outT += t.usage.outputTokens;
      }
    }
    return { inT, outT, usd: estimateUsdCost({ inputTokens: inT, outputTokens: outT }) };
  }, [turns]);

  // Persist history whenever it changes.
  useEffect(() => {
    saveHistory(turns);
  }, [turns]);

  // Esc to close (but bypass when an input is focused mid-typing).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (running) {
          abortRef.current?.abort();
          return;
        }
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, running]);

  // Focus the textarea on open.
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Auto-scroll to bottom whenever a turn is added or status changes.
  useEffect(() => {
    const el = conversationRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [turns.length, statusLine, running]);

  // Auto-resize the textarea up to a cap.
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(160, ta.scrollHeight)}px`;
  }, [input]);

  const send = () => {
    const text = input.trim();
    if (!text || running || !anthropicKey) return;

    const userTurn: AskTurn = { role: "user", text, at: Date.now() };
    const baseHistory = [...turns, userTurn];
    setTurns(baseHistory);
    setInput("");
    setError(null);
    setStatusLine("thinking…");
    setRunning(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    runAsk({
      history: turns,
      userInput: text,
      apiKey: anthropicKey,
      context: ctx,
      signal: ctrl.signal,
      callbacks: {
        onStatus: (s) => setStatusLine(s),
        onAssistantTurn: (turn) => {
          setTurns((prev) => [...prev, turn]);
          setStatusLine(null);
        },
        onError: (err) => setError(err.message),
        onDone: () => {
          setRunning(false);
          setStatusLine(null);
        },
      },
    });
  };

  const cancel = () => {
    abortRef.current?.abort();
  };

  const clear = () => {
    if (running) return;
    if (turns.length === 0) return;
    if (!window.confirm("Clear this conversation? History is local-only.")) return;
    setTurns([]);
    setError(null);
  };

  const onTextareaKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd+K / Ctrl+K → clear (only when no modifier on Esc would have caught it).
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      clear();
      return;
    }
    // Plain Enter → send. Shift+Enter → newline.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const onUseSuggested = (prompt: string) => {
    setInput(prompt);
    // Defer send so the input shows the prompt for a frame.
    requestAnimationFrame(() => {
      const ta = textareaRef.current;
      if (ta) {
        ta.value = prompt;
        ta.focus();
      }
      // Send after another frame so React state has caught up.
      requestAnimationFrame(() => {
        // Use a local ref to bypass stale closure on `input`.
        sendNow(prompt);
      });
    });
  };

  // Send-now bypassing state lag — used by suggested prompts.
  const sendNow = (text: string) => {
    if (running || !anthropicKey) return;
    const userTurn: AskTurn = { role: "user", text, at: Date.now() };
    setTurns((prev) => [...prev, userTurn]);
    setInput("");
    setError(null);
    setStatusLine("thinking…");
    setRunning(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    runAsk({
      history: turns,
      userInput: text,
      apiKey: anthropicKey,
      context: ctx,
      signal: ctrl.signal,
      callbacks: {
        onStatus: (s) => setStatusLine(s),
        onAssistantTurn: (turn) => {
          setTurns((prev) => [...prev, turn]);
          setStatusLine(null);
        },
        onError: (err) => setError(err.message),
        onDone: () => { setRunning(false); setStatusLine(null); },
      },
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="ask-modal" onClick={(e) => e.stopPropagation()}>
        <header className="ask-head">
          <div className="ask-title">
            <span className="ask-spark">✦</span>
            <span className="ask-title-main">Ask your stack</span>
            {integrations.length > 0 && (
              <span className="ask-title-meta">
                · {integrations.length === 1
                  ? integrations[0]
                  : `${integrations.length} sources`}
              </span>
            )}
          </div>
          <div className="ask-head-actions">
            {totalUsage.inT + totalUsage.outT > 0 && (
              <span
                className="ask-cost"
                title={`${totalUsage.inT.toLocaleString()} in / ${totalUsage.outT.toLocaleString()} out`}
              >
                {(totalUsage.inT + totalUsage.outT).toLocaleString()} tok ·{" "}
                ${totalUsage.usd.toFixed(3)}
              </span>
            )}
            {turns.length > 0 && !running && (
              <button
                type="button"
                className="ask-clear"
                onClick={clear}
                title="Clear conversation (⌘K)"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              className="drawer-x ask-close"
              onClick={onClose}
              aria-label="Close"
            >
              <Icon.close />
            </button>
          </div>
        </header>

        <div className="ask-body" ref={conversationRef}>
          {!anthropicKey ? (
            <div className="ask-empty">
              <div className="ask-empty-spark">✦</div>
              <h3>Add an Anthropic key to start asking</h3>
              <p>
                Ask uses your own Anthropic API key — browser-direct, never proxied through
                Hangar. Drop the key in your vault and ask anything about your stack.
              </p>
              <button type="button" className="primary-btn" onClick={onAddAnthropicKey}>
                <Icon.key /> Add Anthropic key
              </button>
            </div>
          ) : turns.length === 0 ? (
            <div className="ask-empty">
              <div className="ask-empty-spark">✦</div>
              <h3>What do you want to know about your stack?</h3>
              <p>
                Ask runs across your connected tools using the tokens in your vault.
                {integrations.length > 1 && (
                  <>
                    {" "}This session can reach{" "}
                    <strong>{integrations.filter((i) => !i.startsWith("read_stack")).join(", ") || "no remote tools yet"}</strong>.
                  </>
                )}
              </p>
              <div className="ask-suggestions">
                {SUGGESTED_PROMPTS.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    className="ask-suggestion"
                    onClick={() => onUseSuggested(s.prompt)}
                  >
                    <span className="ask-suggestion-label">{s.label}</span>
                    <span className="ask-suggestion-prompt">{s.prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <ul className="ask-turns">
              {turns.map((turn, i) => (
                <li key={i} className={`ask-turn ask-turn-${turn.role}`}>
                  {turn.role === "user" ? (
                    <div className="ask-bubble-user">
                      <div className="ask-bubble-text">{turn.text}</div>
                    </div>
                  ) : (
                    <div className="ask-bubble-assistant">
                      {turn.toolCalls && turn.toolCalls.length > 0 && (
                        <div className="ask-tool-calls">
                          {turn.toolCalls.map((tc, j) => (
                            <span
                              key={j}
                              className={`ask-tool-chip ${tc.ok ? "" : "is-error"}`}
                            >
                              {tc.ok ? "✓" : "✕"} {tc.name.replace(/_/g, " ")}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="ask-prose">{renderProse(turn.text)}</div>
                      {turn.citations && turn.citations.length > 0 && (
                        <div className="ask-citations">
                          <div className="ask-citations-label">Sources</div>
                          <div className="ask-citations-list">
                            {turn.citations.slice(0, 8).map((c, j) => {
                              const tool = toolById.get(c.toolId);
                              return (
                                <a
                                  key={j}
                                  className="ask-citation"
                                  href={c.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {tool && <ToolLogo tool={tool} size={22} />}
                                  <div className="ask-citation-body">
                                    <div className="ask-citation-title">{c.title}</div>
                                    <div className="ask-citation-sub">
                                      <span className="ask-citation-type">{c.type}</span>
                                      {c.subtitle && <span> · {c.subtitle}</span>}
                                      {c.timestamp && <span> · {timeAgo(c.timestamp)}</span>}
                                    </div>
                                  </div>
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
              {running && statusLine && (
                <li className="ask-turn ask-turn-assistant">
                  <div className="ask-bubble-assistant ask-pending">
                    <div className="ask-status">
                      <span className="ask-pending-dot" />
                      <span className="ask-pending-dot" />
                      <span className="ask-pending-dot" />
                      <span className="ask-pending-text">{statusLine}</span>
                    </div>
                  </div>
                </li>
              )}
              {error && (
                <li className="ask-turn">
                  <div className="ask-error">
                    Couldn&apos;t reach Anthropic: <code>{error}</code>
                  </div>
                </li>
              )}
            </ul>
          )}
        </div>

        {anthropicKey && (
          <div className="ask-compose">
            <div className="ask-compose-inner">
              <textarea
                ref={textareaRef}
                className="ask-textarea"
                placeholder={
                  turns.length === 0
                    ? "Ask anything about your stack…"
                    : "Follow up…"
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onTextareaKey}
                rows={1}
                disabled={running}
              />
              {running ? (
                <button
                  type="button"
                  className="ask-send is-cancel"
                  onClick={cancel}
                  title="Cancel"
                >
                  ⏹
                </button>
              ) : (
                <button
                  type="button"
                  className="ask-send"
                  onClick={send}
                  disabled={!input.trim()}
                  title="Send (Enter)"
                  aria-label="Send"
                >
                  ↑
                </button>
              )}
            </div>
            <div className="ask-compose-hint">
              <span><kbd>Enter</kbd> send</span>
              <span><kbd>⇧Enter</kbd> newline</span>
              <span><kbd>⌘K</kbd> clear</span>
              <span><kbd>Esc</kbd> {running ? "cancel" : "close"}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
