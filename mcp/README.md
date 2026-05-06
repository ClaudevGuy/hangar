# Hangar MCP

Model Context Protocol server that exposes your Hangar dev-tool stack to local AI agents — Claude Desktop, Cursor, and anything else that speaks MCP over stdio.

Once installed and pointed at your config, you can ask the AI things like:

- *"What's in my dev stack?"*
- *"What's broken on Sentry right now?"*
- *"Show me my failed Vercel deploys this week."*
- *"Given my stack and these new errors, what's most likely the cause?"*

The AI gets structured access to your tools and live signals — no more "let me set up integrations for each AI assistant separately."

---

## Install

From the Hangar repo root:

```bash
cd mcp
npm install
npm run build
```

The compiled server lands at `mcp/dist/index.js`.

If you want to run it from anywhere, also `npm link` from `mcp/` so the `hangar-mcp` binary is on your `PATH`.

---

## Configure

### 1. Stack config

Create `~/.hangar/mcp.json` with the tools you actually use:

```json
{
  "tools": [
    { "id": "vercel",  "name": "Vercel",  "category": "Hosting",     "plan": "Pro" },
    { "id": "sentry",  "name": "Sentry",  "category": "Monitoring",  "plan": "Team" },
    { "id": "neon",    "name": "Neon",    "category": "Database",    "plan": "Free" },
    { "id": "linear",  "name": "Linear",  "category": "Code"                       }
  ]
}
```

Override the path with `HANGAR_MCP_CONFIG=/path/to/file.json` if you'd rather keep it elsewhere.

### 2. API tokens (for live signal tools)

Set environment variables for the providers you want live access to. If a token isn't set, that specific tool will return an error but the others still work.

| Env var          | Where to create                                                              | Scopes                                     |
| ---------------- | ---------------------------------------------------------------------------- | ------------------------------------------ |
| `SENTRY_TOKEN`   | <https://sentry.io/settings/account/api/auth-tokens/>                        | `org:read`, `project:read`, `event:read`   |
| `VERCEL_TOKEN`   | <https://vercel.com/account/tokens>                                          | Read access to your projects               |

Tokens are read at startup and held in process memory only. They are never written to disk by this server.

---

## Connect to Claude Desktop

Edit your Claude Desktop config:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Add a `hangar` entry under `mcpServers`:

```json
{
  "mcpServers": {
    "hangar": {
      "command": "node",
      "args": ["/absolute/path/to/hangar/mcp/dist/index.js"],
      "env": {
        "SENTRY_TOKEN": "your-sentry-auth-token",
        "VERCEL_TOKEN": "your-vercel-token"
      }
    }
  }
}
```

Restart Claude Desktop. The Hangar tools should appear in the tools list (look for the hammer icon in chat).

---

## Tools exposed

| Tool                     | Reads from           | What it returns                                                |
| ------------------------ | -------------------- | -------------------------------------------------------------- |
| `read_stack`             | `~/.hangar/mcp.json` | Your tools + plans + categories + last-opened timestamps.      |
| `list_unresolved_issues` | Sentry API           | Top 10 unresolved issues from the last 14 days.                |
| `list_recent_deploys`    | Vercel API           | Recent deploys; supports `limit` (1–100) and `onlyFailed: true`. |

---

## Roadmap

- `list_assigned_issues` — Linear (P1+ ticket queue)
- `list_review_requests` — GitHub
- `get_monthly_spend` — bundled pricing data + the user's set plans
- Auto-sync stack config from your Hangar web app's gist (no manual JSON edit)
- An "Export MCP config" button in the Hangar dashboard
