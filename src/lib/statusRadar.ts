// Stack Status Radar — fetches public StatusPage.io endpoints for the user's
// pinned tools so they don't have to keep six status tabs open. Endpoints
// expose a CORS-friendly `Access-Control-Allow-Origin: *`, so we hit them
// directly from the browser. Pure local: no backend, no proxy.

export type StatusIndicator =
  | "none"
  | "minor"
  | "major"
  | "critical"
  | "maintenance"
  | "unknown";

export interface ProviderStatus {
  toolId: string;
  indicator: StatusIndicator;
  description: string;
  url: string;
  fetchedAt: number;
  error?: string;
}

interface StatusPageResponse {
  status?: {
    indicator?: string;
    description?: string;
  };
}

// Map of tool id → public status endpoint. Each entry is a JSON v2 status
// API (the StatusPage.io standard). Add new tools here as integrations land.
// Failed fetches surface as "unknown" pills, so it's safe to include URLs
// we're not 100% certain about — graceful degradation either way.
export const STATUS_PAGES: Record<string, { api: string; page: string }> = {
  // Hosting
  vercel:      { api: "https://www.vercel-status.com/api/v2/status.json",   page: "https://www.vercel-status.com" },
  netlify:     { api: "https://www.netlifystatus.com/api/v2/status.json",   page: "https://www.netlifystatus.com" },
  fly:         { api: "https://status.flyio.net/api/v2/status.json",        page: "https://status.flyio.net" },
  cloudflare:  { api: "https://www.cloudflarestatus.com/api/v2/status.json", page: "https://www.cloudflarestatus.com" },
  // Databases
  // NOTE: Neon is intentionally NOT in this map. neonstatus.com hosts a
  // StatusPage.io page but blocks CORS for /api/v2/status.json from
  // browser origins, and its underlying canonical statuspage.io URL is
  // similarly blocked. There's no public endpoint we can hit from the
  // browser today — adding Neon here would render a permanent "unknown"
  // pill, which is worse than omitting it. Re-add if/when Neon ships a
  // browser-accessible status feed.
  supabase:    { api: "https://status.supabase.com/api/v2/status.json",     page: "https://status.supabase.com" },
  planetscale: { api: "https://status.planetscale.com/api/v2/status.json",  page: "https://status.planetscale.com" },
  mongodb:     { api: "https://status.mongodb.com/api/v2/status.json",      page: "https://status.mongodb.com" },
  // Auth
  clerk:       { api: "https://status.clerk.com/api/v2/status.json",        page: "https://status.clerk.com" },
  auth0:       { api: "https://status.auth0.com/api/v2/status.json",        page: "https://status.auth0.com" },
  workos:      { api: "https://status.workos.com/api/v2/status.json",       page: "https://status.workos.com" },
  // Code
  github:      { api: "https://www.githubstatus.com/api/v2/status.json",    page: "https://www.githubstatus.com" },
  gitlab:      { api: "https://status.gitlab.com/api/v2/status.json",       page: "https://status.gitlab.com" },
  linear:      { api: "https://status.linear.app/api/v2/status.json",       page: "https://status.linear.app" },
  // Jobs / queues
  inngest:     { api: "https://status.inngest.com/api/v2/status.json",      page: "https://status.inngest.com" },
  trigger:     { api: "https://status.trigger.dev/api/v2/status.json",      page: "https://status.trigger.dev" },
  upstash:     { api: "https://status.upstash.com/api/v2/status.json",      page: "https://status.upstash.com" },
  // Monitoring
  sentry:      { api: "https://status.sentry.io/api/v2/status.json",        page: "https://status.sentry.io" },
  posthog:     { api: "https://status.posthog.com/api/v2/status.json",      page: "https://status.posthog.com" },
  datadog:     { api: "https://status.datadoghq.com/api/v2/status.json",    page: "https://status.datadoghq.com" },
  // Email
  resend:      { api: "https://status.resend.com/api/v2/status.json",       page: "https://status.resend.com" },
  postmark:    { api: "https://status.postmarkapp.com/api/v2/status.json",  page: "https://status.postmarkapp.com" },
  // Payments
  stripe:      { api: "https://status.stripe.com/api/v2/status.json",       page: "https://status.stripe.com" },
  // AI
  // Anthropic's custom domain (status.anthropic.com / status.claude.com)
  // doesn't allow browser CORS on the StatusPage.io API endpoints, so
  // we hit the canonical anthropic.statuspage.io URL which does. The
  // public-facing page link still points users to the friendly host.
  anthropic:   { api: "https://anthropic.statuspage.io/api/v2/status.json", page: "https://status.anthropic.com" },
  openai:      { api: "https://status.openai.com/api/v2/status.json",       page: "https://status.openai.com" },
  // Design
  figma:       { api: "https://www.figmastatus.com/api/v2/status.json",     page: "https://www.figmastatus.com" },
};

function validIndicator(v: unknown): StatusIndicator | null {
  if (typeof v !== "string") return null;
  if (v === "none" || v === "minor" || v === "major" || v === "critical" || v === "maintenance") {
    return v;
  }
  return null;
}

export async function fetchProviderStatus(
  toolId: string,
  signal?: AbortSignal,
): Promise<ProviderStatus> {
  const entry = STATUS_PAGES[toolId];
  if (!entry) {
    throw new Error(`No status page configured for ${toolId}`);
  }
  try {
    const res = await fetch(entry.api, { signal });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    const body = (await res.json()) as StatusPageResponse;
    return {
      toolId,
      indicator: validIndicator(body.status?.indicator) ?? "unknown",
      description: body.status?.description ?? "",
      url: entry.page,
      fetchedAt: Date.now(),
    };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw err; // bubble up so the hook can ignore the late resolution
    }
    return {
      toolId,
      indicator: "unknown",
      description: "Couldn't reach status page",
      url: entry.page,
      fetchedAt: Date.now(),
      error: err instanceof Error ? err.message : "fetch failed",
    };
  }
}
