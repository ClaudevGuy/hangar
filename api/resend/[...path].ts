// Resend API proxy. Browser-direct calls to api.resend.com are blocked
// by CORS, so this Vercel Function forwards the user's API key (sent in
// the Authorization header) and streams the response back. The function
// holds no state and stores no tokens — every call is per-request.

const UPSTREAM = "https://api.resend.com";

export async function GET(req: Request): Promise<Response> {
  const auth = req.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    return json({ error: "Missing or malformed Authorization header" }, 401);
  }

  let upstreamUrl: string;
  try {
    const url = new URL(req.url);
    // Strip the /api/resend prefix so /api/resend/emails -> /emails upstream.
    const path = url.pathname.replace(/^\/api\/resend/, "") || "/";
    upstreamUrl = `${UPSTREAM}${path}${url.search}`;
  } catch (err) {
    console.error("[api/resend] bad request url", err);
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
      console.error("[api/resend] upstream non-OK", { status: upstreamRes.status, url: upstreamUrl });
    }
    return new Response(body, {
      status: upstreamRes.status,
      headers: {
        "content-type": upstreamRes.headers.get("content-type") ?? "application/json",
        // Per-user response — never let the edge cache it.
        "cache-control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("[api/resend] upstream fetch failed", err);
    return json({ error: err instanceof Error ? err.message : "Upstream fetch failed" }, 502);
  }
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
