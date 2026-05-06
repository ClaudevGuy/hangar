// Resend API proxy. Browser-direct calls to api.resend.com are blocked
// by CORS, so this Vercel Function forwards the user's API key (sent in
// the Authorization header) and streams the response back. The function
// holds no state and stores no tokens — every call is per-request.

const UPSTREAM = "https://api.resend.com";

export default async function handler(req: Request): Promise<Response> {
  const auth = req.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    return json({ error: "Missing or malformed Authorization header" }, 401);
  }

  const url = new URL(req.url);
  // Strip the /api/resend prefix so /api/resend/emails -> /emails upstream.
  const path = url.pathname.replace(/^\/api\/resend/, "") || "/";
  const upstreamUrl = `${UPSTREAM}${path}${url.search}`;

  // Only forward the methods we'll actually use from the client.
  const method = req.method.toUpperCase();
  if (!["GET", "HEAD"].includes(method)) {
    return json({ error: `Method ${method} not allowed` }, 405);
  }

  try {
    const upstreamRes = await fetch(upstreamUrl, {
      method,
      headers: {
        Authorization: auth,
        Accept: "application/json",
      },
    });
    const body = await upstreamRes.text();
    return new Response(body, {
      status: upstreamRes.status,
      headers: {
        "content-type": upstreamRes.headers.get("content-type") ?? "application/json",
        // Avoid caching at the edge — the response is per-user.
        "cache-control": "private, no-store",
      },
    });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Upstream fetch failed" }, 502);
  }
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
