// "Ask your stack" — multi-turn chat over the askTools, browser-direct to
// the Anthropic Messages API. The conversation runs as a loop: each
// iteration sends history → receives a response → executes any tool_use
// blocks → appends tool_results → continues until Claude stops with
// stop_reason "end_turn".

import { ASK_TOOLS, availableIntegrations, type AskCitation, type ToolContext } from "./askTools";

// ─────────────────────────────────────────────────────────────────────────
// Anthropic message shape — only the fields we touch
// ─────────────────────────────────────────────────────────────────────────

interface TextBlock {
  type: "text";
  text: string;
}
interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}
interface ToolResultBlock {
  type: "tool_result";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}
type ContentBlock = TextBlock | ToolUseBlock | ToolResultBlock;

interface Message {
  role: "user" | "assistant";
  content: string | ContentBlock[];
}

interface AnthropicResponse {
  id: string;
  content: ContentBlock[];
  stop_reason: "end_turn" | "tool_use" | "max_tokens" | "stop_sequence" | string;
  usage: { input_tokens: number; output_tokens: number };
}

// ─────────────────────────────────────────────────────────────────────────
// Public conversation types — what the UI persists + renders
// ─────────────────────────────────────────────────────────────────────────

export interface AskTurn {
  role: "user" | "assistant";
  text: string;
  // Tool calls executed during this assistant turn (assistant turns only).
  toolCalls?: { name: string; input: Record<string, unknown>; ok: boolean }[];
  // Citations gathered from all tools called during this turn.
  citations?: AskCitation[];
  // Cumulative usage at this turn (assistant turns only).
  usage?: { inputTokens: number; outputTokens: number };
  // Wall-clock time the turn finished, for display.
  at: number;
}

export interface AskCallbacks {
  // Streaming-style status updates so the UI can render "querying X…" etc.
  onStatus(text: string): void;
  // Final assistant turn ready to render.
  onAssistantTurn(turn: AskTurn): void;
  // Fatal error during the run.
  onError(err: Error): void;
  // Always called once when the run finishes (success or error).
  onDone(): void;
}

// Sonnet 4.5 pricing (per million tokens). Used for the cost meter.
const PRICE_INPUT_PER_MTOK = 3.0;
const PRICE_OUTPUT_PER_MTOK = 15.0;

export function estimateUsdCost(usage: { inputTokens: number; outputTokens: number }): number {
  return (
    (usage.inputTokens * PRICE_INPUT_PER_MTOK + usage.outputTokens * PRICE_OUTPUT_PER_MTOK) /
    1_000_000
  );
}

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-5";
const MAX_TOOL_ITERATIONS = 8;

function buildSystemPrompt(ctx: ToolContext): string {
  const integrations = availableIntegrations(ctx);
  return `You are "Hangar Ask" — a senior dev's stack assistant living inside the Hangar dashboard.

You answer questions about the user's pinned dev stack by calling the available tools. Always reach for tools first; do not invent data. If a tool errors or returns nothing, say so plainly.

Available integrations this session: ${integrations.join(", ")}.

Style:
- Concise. Short sentences. No filler.
- Use **bold** for tool names and identifiers (e.g. **Vercel**, **HAN-87**).
- Cross-reference where useful: e.g. "deploy abc123 ⟶ Sentry spike at 14:22".
- When you cite a specific item (a deploy, issue, PR, repo), the UI will surface it as a clickable card automatically — you don't need to paste URLs.
- Don't mention tools the user hasn't connected — if Sentry isn't in the integration list above, write around it.
- If a question is outside the stack (e.g. general programming), answer briefly without calling tools.

Time now: ${new Date().toISOString()}.`;
}

// Convert AskTurn[] history into Anthropic messages. We keep only the
// user text + the final assistant text per turn — tool_use/tool_result
// blocks aren't replayed, since the model can re-call tools when needed
// and replaying them inflates input tokens.
function turnsToMessages(history: AskTurn[]): Message[] {
  return history.map((t) => ({
    role: t.role,
    content: t.text,
  }));
}

// Text content of a response. Concatenate all text blocks.
function joinText(content: ContentBlock[]): string {
  return content
    .filter((b): b is TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n\n")
    .trim();
}

async function callAnthropic(
  messages: Message[],
  systemPrompt: string,
  apiKey: string,
  signal: AbortSignal,
): Promise<AnthropicResponse> {
  const body = {
    model: MODEL,
    max_tokens: 1500,
    system: systemPrompt,
    tools: ASK_TOOLS.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.input_schema,
    })),
    messages,
  };
  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) {
    let detail = "";
    try {
      const errBody = (await res.json()) as { error?: { message?: string; type?: string } };
      const msg = errBody.error?.message ?? errBody.error?.type;
      if (msg) detail = ` — ${msg}`;
    } catch {
      // body wasn't JSON, ignore
    }
    throw new Error(`Anthropic: ${res.status} ${res.statusText}${detail}`);
  }
  return (await res.json()) as AnthropicResponse;
}

// ─────────────────────────────────────────────────────────────────────────
// Public entry: run a single user input through the tool-use loop.
// ─────────────────────────────────────────────────────────────────────────

export interface RunAskOptions {
  history: AskTurn[];
  userInput: string;
  apiKey: string;
  context: ToolContext;
  signal: AbortSignal;
  callbacks: AskCallbacks;
}

export async function runAsk({
  history, userInput, apiKey, context, signal, callbacks,
}: RunAskOptions): Promise<void> {
  let totalInput = 0;
  let totalOutput = 0;
  const toolCalls: { name: string; input: Record<string, unknown>; ok: boolean }[] = [];
  const citations: AskCitation[] = [];

  // Build initial messages: prior history (text-only) + new user message.
  const messages: Message[] = [
    ...turnsToMessages(history),
    { role: "user", content: userInput },
  ];

  const system = buildSystemPrompt(context);

  try {
    let iteration = 0;
    while (iteration++ < MAX_TOOL_ITERATIONS) {
      callbacks.onStatus(iteration === 1 ? "thinking…" : "thinking…");

      const response = await callAnthropic(messages, system, apiKey, signal);
      totalInput += response.usage.input_tokens;
      totalOutput += response.usage.output_tokens;

      // Append the assistant turn (entire content blocks — needed so we
      // can match tool_use ids when we send tool_results next).
      messages.push({ role: "assistant", content: response.content });

      if (response.stop_reason !== "tool_use") {
        // We have the final answer — break out.
        const text = joinText(response.content);
        callbacks.onAssistantTurn({
          role: "assistant",
          text: text || "(no response)",
          toolCalls,
          citations,
          usage: { inputTokens: totalInput, outputTokens: totalOutput },
          at: Date.now(),
        });
        callbacks.onDone();
        return;
      }

      // Tool use — execute every tool_use block, gather results, then loop.
      const toolUseBlocks = response.content.filter(
        (b): b is ToolUseBlock => b.type === "tool_use",
      );
      const results: ToolResultBlock[] = [];

      for (const block of toolUseBlocks) {
        const def = ASK_TOOLS.find((t) => t.name === block.name);
        if (!def) {
          results.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: `Unknown tool: ${block.name}`,
            is_error: true,
          });
          toolCalls.push({ name: block.name, input: block.input, ok: false });
          continue;
        }
        callbacks.onStatus(`querying ${block.name.replace(/_/g, " ")}…`);
        try {
          const outcome = await def.run(block.input, context, signal);
          for (const c of outcome.citations) citations.push(c);
          toolCalls.push({ name: block.name, input: block.input, ok: true });
          results.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: JSON.stringify(outcome.summary),
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Tool failed";
          toolCalls.push({ name: block.name, input: block.input, ok: false });
          results.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: msg,
            is_error: true,
          });
        }
      }

      messages.push({ role: "user", content: results });
    }

    // We blew past the iteration cap — force-emit what we have.
    callbacks.onAssistantTurn({
      role: "assistant",
      text:
        "I needed too many tool calls and stopped to avoid spending more tokens. Try a narrower question.",
      toolCalls,
      citations,
      usage: { inputTokens: totalInput, outputTokens: totalOutput },
      at: Date.now(),
    });
    callbacks.onDone();
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      callbacks.onDone();
      return;
    }
    callbacks.onError(err instanceof Error ? err : new Error("Unknown error"));
    callbacks.onDone();
  }
}
