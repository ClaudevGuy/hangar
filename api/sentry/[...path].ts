// Sentry API proxy. Browser-direct calls to sentry.io/api/0 are blocked by
// CORS unless the org allowlists the origin. This Vercel Function forwards
// the user's auth token (Authorization header) and streams the response back.
// Stateless — no token is ever persisted server-side.

const UPSTREAM = "https://sentry.io/api/0";

export async function GET(req: Request): Promise<Response> {
  const auth = req.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    return json({ error: "Missing or malformed Authorization header" }, 401);
  }

  let upstreamUrl: string;
  try {
    const url = new URL(req.url);
    // /api/sentry/organizations/foo -> /organizations/foo upstream.
    const path = url.pathname.replace(/^\/api\/sentry/, "") || "/";
    upstreamUrl = `${UPSTREAM}${path}${url.search}`;
  } catch (err) {
    console.error("[api/sentry] bad request url", err);
    return json({ error: `Bad request URL: ${err instanceof Error ? err.message : "unknown"}` }, 400);
  }

  try {
    const upstreamRes = await fetch(upstreamUrl, {
      method: "GET",
      headers: {
        Authorization: auth,
        Accept: "application/json",
      },
    });
    const body = await upstreamRes.text();
    if (!upstreamRes.ok) {
      console.error("[api/sentry] upstream non-OK", { status: upstreamRes.status, url: upstreamUrl });
    }
    return new Response(body, {
      status: upstreamRes.status,
      headers: {
        "content-type": upstreamRes.headers.get("content-type") ?? "application/json",
        "cache-control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("[api/sentry] upstream fetch failed", err);
    return json({ error: err instanceof Error ? err.message : "Upstream fetch failed" }, 502);
  }
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
