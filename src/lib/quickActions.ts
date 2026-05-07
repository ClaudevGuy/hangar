// Per-tool Quick Actions — browser-direct API calls authenticated with the
// user's vault token. Each action is a single fetch; UI is responsible for
// optimistic dismissal and error rollback.
//
// Pattern: every function returns void on success, throws Error on failure
// with a human-readable message. The TodayPanel surfaces the message to the
// user inline and restores the row.

// ── Sentry ────────────────────────────────────────────────────────────

async function sentryUpdateStatus(
  issueId: string,
  token: string,
  status: "resolved" | "ignored",
): Promise<void> {
  const res = await fetch(`/api/sentry/issues/${encodeURIComponent(issueId)}/`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    let detail = "";
    try {
      const body = (await res.json()) as { detail?: string; error?: string };
      detail = body.detail ?? body.error ?? "";
    } catch {
      // Body wasn't JSON; ignore.
    }
    throw new Error(`Sentry: ${res.status} ${res.statusText}${detail ? ` — ${detail}` : ""}`);
  }
}

export function resolveSentryIssue(issueId: string, token: string): Promise<void> {
  return sentryUpdateStatus(issueId, token, "resolved");
}

export function ignoreSentryIssue(issueId: string, token: string): Promise<void> {
  return sentryUpdateStatus(issueId, token, "ignored");
}

// ── Linear ────────────────────────────────────────────────────────────

interface LinearGqlResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

async function linearMutate<T>(
  query: string,
  variables: Record<string, unknown>,
  token: string,
): Promise<T> {
  const res = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Linear uses the bare token — no "Bearer " prefix.
      Authorization: token,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    throw new Error(`Linear: ${res.status} ${res.statusText}`);
  }
  const body = (await res.json()) as LinearGqlResponse<T>;
  if (body.errors && body.errors.length > 0) {
    throw new Error(`Linear: ${body.errors[0]!.message}`);
  }
  if (!body.data) throw new Error("Linear: empty response");
  return body.data;
}

const LINEAR_SNOOZE = `
  mutation Snooze($id: String!) {
    issueUpdate(id: $id, input: { priority: 4 }) {
      success
    }
  }
`;

// "Snooze" = lower an urgent ticket's priority to Low (4). Removes it from
// urgent triage but keeps it in your queue. Reversible from inside Linear.
export async function snoozeLinearIssue(issueId: string, token: string): Promise<void> {
  const data = await linearMutate<{ issueUpdate: { success: boolean } }>(
    LINEAR_SNOOZE,
    { id: issueId },
    token,
  );
  if (!data.issueUpdate.success) {
    throw new Error("Linear: issueUpdate returned success=false");
  }
}
