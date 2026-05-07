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
export const STATUS_PAGES: Record<string, { api: string; page: string }> = {
  vercel:     { api: "https://www.vercel-status.com/api/v2/status.json",   page: "https://www.vercel-status.com" },
  github:     { api: "https://www.githubstatus.com/api/v2/status.json",    page: "https://www.githubstatus.com" },
  stripe:     { api: "https://status.stripe.com/api/v2/status.json",       page: "https://status.stripe.com" },
  sentry:     { api: "https://status.sentry.io/api/v2/status.json",        page: "https://status.sentry.io" },
  linear:     { api: "https://status.linear.app/api/v2/status.json",       page: "https://status.linear.app" },
  cloudflare: { api: "https://www.cloudflarestatus.com/api/v2/status.json", page: "https://www.cloudflarestatus.com" },
  supabase:   { api: "https://status.supabase.com/api/v2/status.json",     page: "https://status.supabase.com" },
  clerk:      { api: "https://status.clerk.com/api/v2/status.json",        page: "https://status.clerk.com" },
  auth0:      { api: "https://status.auth0.com/api/v2/status.json",        page: "https://status.auth0.com" },
  anthropic:  { api: "https://status.anthropic.com/api/v2/status.json",    page: "https://status.anthropic.com" },
  inngest:    { api: "https://status.inngest.com/api/v2/status.json",      page: "https://status.inngest.com" },
  resend:     { api: "https://status.resend.com/api/v2/status.json",       page: "https://status.resend.com" },
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
