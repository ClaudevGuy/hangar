import { TOOLS } from "../data/tools";
import type { Tool } from "../types";

// Match a URL to a built-in catalog tool by hostname (or a custom tool's
// accountUrl hostname) so the linkboard can show the right logo.
//
// Also derives a sensible default label based on the URL's path — e.g.
// https://github.com/foo/bar/pull/42 → "foo/bar #42".

export interface LinkSuggestion {
  tool: Tool | null;
  label: string;
}

function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function inferTool(url: string, customTools: Tool[] = []): Tool | null {
  const host = hostnameOf(url);
  if (!host) return null;
  const all = [...TOOLS, ...customTools];
  // Match by accountUrl hostname (also docs hostname as a fallback).
  for (const t of all) {
    const accHost = hostnameOf(t.accountUrl);
    const docsHost = hostnameOf(t.docs);
    if (!accHost) continue;
    // Allow subdomain matches: dashboard.stripe.com → stripe.com
    if (host === accHost || host.endsWith("." + stripSubdomains(accHost))) return t;
    if (docsHost && (host === docsHost || host.endsWith("." + stripSubdomains(docsHost)))) return t;
  }
  return null;
}

function stripSubdomains(host: string): string {
  // For "dashboard.stripe.com" return "stripe.com"; for "stripe.com" return "stripe.com".
  const parts = host.split(".");
  if (parts.length <= 2) return host;
  return parts.slice(-2).join(".");
}

export function deriveLabel(url: string, tool: Tool | null): string {
  const host = hostnameOf(url) ?? url;
  let path: string;
  try {
    path = new URL(url).pathname.replace(/^\/+|\/+$/g, "");
  } catch {
    return tool?.name ?? host;
  }
  if (!path) return tool?.name ?? host;

  // Common patterns we can compress.
  if (host === "github.com") {
    // github.com/owner/repo[/pull/N | /issues/N | /actions]
    const m = path.match(/^([^/]+)\/([^/]+)(?:\/(pull|issues)\/(\d+))?/);
    if (m) {
      const repo = `${m[1]}/${m[2]}`;
      if (m[3] === "pull") return `${repo} PR #${m[4]}`;
      if (m[3] === "issues") return `${repo} #${m[4]}`;
      return repo;
    }
  }
  if (host.endsWith("linear.app")) {
    // linear.app/<workspace>/issue/ABC-123
    const m = path.match(/^[^/]+\/issue\/([A-Z]+-\d+)/);
    if (m) return m[1];
  }
  if (host.endsWith("vercel.com") || host.endsWith("vercel.app")) {
    const segs = path.split("/").filter(Boolean);
    if (segs.length >= 1) return `${tool?.name ?? "Vercel"}: ${segs.slice(-1)[0]}`;
  }
  if (host === "dashboard.stripe.com") {
    const segs = path.split("/").filter(Boolean);
    if (segs.length) return `${tool?.name ?? "Stripe"}: ${segs.slice(-1)[0]}`;
  }
  // Fallback — last path segment.
  const last = path.split("/").pop();
  return last ? `${tool?.name ? tool.name + ": " : ""}${last}` : (tool?.name ?? host);
}

export function suggest(url: string, customTools: Tool[] = []): LinkSuggestion {
  const tool = inferTool(url, customTools);
  return { tool, label: deriveLabel(url, tool) };
}
