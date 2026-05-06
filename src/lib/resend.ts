// Resend REST client. Goes through the local /api/resend proxy because
// api.resend.com blocks browser CORS. Token at https://resend.com/api-keys.

export interface ResendEmail {
  id: string;
  from: string;
  to: string[];
  subject: string;
  created_at: string;
  last_event?: string;
}

export interface ResendDomain {
  id: string;
  name: string;
  status: string;
  region?: string;
  created_at: string;
}

const PROXY = "/api/resend";

function headers(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

async function getJson<T>(path: string, token: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${PROXY}${path}`, { headers: headers(token), signal });
  if (!res.ok) {
    let detail = "";
    try {
      const body = (await res.json()) as { error?: string | { message?: string }; message?: string };
      const msg =
        typeof body.error === "string"
          ? body.error
          : body.error?.message ?? body.message;
      if (msg) detail = ` — ${msg}`;
    } catch {
      // Body wasn't JSON; ignore.
    }
    throw new Error(`${res.status} ${res.statusText}${detail}`);
  }
  return (await res.json()) as T;
}

export function fetchResendEmails(
  token: string,
  signal?: AbortSignal,
): Promise<ResendEmail[]> {
  return getJson<{ data: ResendEmail[] }>("/emails?limit=8", token, signal).then(
    (r) => r.data ?? [],
  );
}

export function fetchResendDomains(
  token: string,
  signal?: AbortSignal,
): Promise<ResendDomain[]> {
  return getJson<{ data: ResendDomain[] }>("/domains", token, signal).then(
    (r) => r.data ?? [],
  );
}
