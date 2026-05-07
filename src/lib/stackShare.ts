// Stack Share — encode the user's pinned stack into a URL hash so anyone
// who clicks the link can preview and adopt it. Pure client-side: the data
// rides in the URL fragment, which browsers never send to the server, so
// nothing about the share ever touches Hangar infrastructure.

import { TOOLS } from "../data/tools";
import type { Tool } from "../types";
import { workspaceKey } from "./workspaces";

export interface ShareTool {
  id: string;
  plan?: string;
}

export interface ShareV1 {
  v: 1;
  title?: string;
  by?: string;
  generatedAt: string;
  tools: ShareTool[];
}

export interface BuildShareArgs {
  stackTools: Pick<Tool, "id">[];
  toolMeta: Record<string, { plan?: string }>;
  title?: string;
  by?: string;
}

export function buildShare(args: BuildShareArgs): ShareV1 {
  return {
    v: 1,
    title: args.title?.trim() || undefined,
    by: args.by?.trim() || undefined,
    generatedAt: new Date().toISOString(),
    tools: args.stackTools.map((t) => {
      const plan = args.toolMeta[t.id]?.plan;
      const entry: ShareTool = { id: t.id };
      if (plan) entry.plan = plan;
      return entry;
    }),
  };
}

// JSON → UTF-8 bytes → URL-safe base64. Uses TextEncoder so titles in any
// language survive the round-trip (btoa alone breaks on non-Latin-1).
export function encodeShare(share: ShareV1): string {
  const json = JSON.stringify(share);
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeShare(b64url: string): ShareV1 | null {
  try {
    const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const bin = atob(padded);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      !Array.isArray(parsed) &&
      (parsed as ShareV1).v === 1 &&
      Array.isArray((parsed as ShareV1).tools)
    ) {
      return parsed as ShareV1;
    }
    return null;
  } catch {
    return null;
  }
}

// Canonical share host. Generated URLs always point at the deployed site
// so they're universally clickable from Twitter, Slack, etc. Recipients
// adopt from a localhost or deployed preview — the data lives in the
// fragment either way.
const CANONICAL_HOST = "https://hangar-silk.vercel.app";

export function buildShareUrl(share: ShareV1): string {
  return `${CANONICAL_HOST}/share#data=${encodeShare(share)}`;
}

// For the deployed-origin preview, this is the URL we tell visitors to
// open in their own local Hangar. Same hash, different origin.
export function buildLocalShareUrl(share: ShareV1, port = 5173): string {
  return `http://localhost:${port}/share#data=${encodeShare(share)}`;
}

export interface ResolvedShareTool extends ShareTool {
  inCatalog: boolean;
  catalog?: Tool;
}

export function resolveShareTools(share: ShareV1): ResolvedShareTool[] {
  return share.tools.map((t) => {
    const catalog = TOOLS.find((c) => c.id === t.id);
    return {
      id: t.id,
      plan: t.plan,
      inCatalog: !!catalog,
      catalog,
    };
  });
}

export interface AdoptResult {
  added: number;
  alreadyHad: number;
  unknown: number;
}

// Merge a share into the active workspace's stack + tool meta in
// localStorage. Caller should reload after, so the React hooks re-read.
export function adoptShare(share: ShareV1): AdoptResult {
  const stackKey = workspaceKey("hangar-stack");
  const metaKey = workspaceKey("hangar-tool-meta");

  let stack: string[] = [];
  let meta: Record<string, { plan?: string; lastOpenedAt?: number }> = {};

  try {
    const raw = localStorage.getItem(stackKey);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        stack = parsed.filter((id): id is string => typeof id === "string");
      }
    }
  } catch {
    // ignore — start with empty stack
  }

  try {
    const raw = localStorage.getItem(metaKey);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        meta = parsed as typeof meta;
      }
    }
  } catch {
    // ignore — start with empty meta
  }

  let added = 0;
  let alreadyHad = 0;
  let unknown = 0;

  for (const tool of share.tools) {
    const inCatalog = TOOLS.some((c) => c.id === tool.id);
    if (!inCatalog) {
      unknown++;
      continue;
    }
    if (stack.includes(tool.id)) {
      alreadyHad++;
    } else {
      stack.push(tool.id);
      added++;
    }
    // Only set the plan if the user hasn't already chosen one for this tool.
    // Don't clobber existing user preferences.
    if (tool.plan && !meta[tool.id]?.plan) {
      meta[tool.id] = { ...(meta[tool.id] ?? {}), plan: tool.plan };
    }
  }

  localStorage.setItem(stackKey, JSON.stringify(stack));
  localStorage.setItem(metaKey, JSON.stringify(meta));
  // Trigger gist sync push if the user has it set up.
  window.dispatchEvent(new Event("hangar:data-changed"));

  return { added, alreadyHad, unknown };
}

export function isLocalHost(): boolean {
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0";
}
