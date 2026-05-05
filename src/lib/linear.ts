// Linear GraphQL client. CORS-friendly with a personal API key.
// Auth header is `Authorization: <api_key>` (no "Bearer" prefix — Linear specific).

export interface LinearViewer {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  organization: { name: string; urlKey: string };
}

export interface LinearIssue {
  id: string;
  identifier: string;
  title: string;
  url: string;
  priority: number;
  state: { name: string; type: string; color: string };
  team: { key: string };
  updatedAt: string;
}

const ENDPOINT = "https://api.linear.app/graphql";

const VIEWER_QUERY = `
  query Viewer {
    viewer {
      id name email avatarUrl
      organization { name urlKey }
    }
  }
`;

const ISSUES_QUERY = `
  query MyIssues {
    viewer {
      assignedIssues(first: 6, orderBy: updatedAt) {
        nodes {
          id identifier title url priority updatedAt
          state { name type color }
          team { key }
        }
      }
    }
  }
`;

interface GqlResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

async function gql<T>(query: string, token: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: JSON.stringify({ query }),
    signal,
  });
  if (!res.ok) {
    throw new Error(`Linear: ${res.status} ${res.statusText}`);
  }
  const body = (await res.json()) as GqlResponse<T>;
  if (body.errors && body.errors.length > 0) {
    throw new Error(`Linear: ${body.errors[0].message}`);
  }
  if (!body.data) throw new Error("Linear: empty response");
  return body.data;
}

export async function fetchLinearViewer(
  token: string,
  signal?: AbortSignal,
): Promise<LinearViewer> {
  const data = await gql<{ viewer: LinearViewer }>(VIEWER_QUERY, token, signal);
  return data.viewer;
}

export async function fetchLinearIssues(
  token: string,
  signal?: AbortSignal,
): Promise<LinearIssue[]> {
  const data = await gql<{ viewer: { assignedIssues: { nodes: LinearIssue[] } } }>(
    ISSUES_QUERY,
    token,
    signal,
  );
  return data.viewer.assignedIssues.nodes;
}
