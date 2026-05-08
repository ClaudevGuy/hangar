# Hangar

> The dev's control tower. Pin the SaaS tools you actually ship with, jump to their dashboards in one click, vault your API keys, and watch your stack from one runway.

**Live site:** <https://hangar-silk.vercel.app/>

Hangar is a single-page React app that ships with a 29-tool catalogue across 11 categories — Vercel, Neon, Stripe, Anthropic, Sentry, Linear, Figma, and friends — and lets you **add any tool that isn't on the list yourself**. Pin the ones you use, store API keys per tool, search across every connected tool from one input, and pull live data straight from each provider (GitHub, Vercel, Linear, Sentry, and Resend wired up today).

It runs entirely in your browser. No backend, no telemetry, no analytics. Your stack and your keys live in `localStorage` only.

The repo serves two surfaces from the same Vite build:

| Route | What lives there |
|---|---|
| `/` | Marketing landing page — sticky nav, hero, problem/feature/catalog/install/FAQ sections, "Park your stack in the hangar." final CTA, and a "Return to tower" scroll-to-top button. |
| `/app` | The Hangar tool itself — the launcher, catalog, vault, drawers, all the features below. |

Anything not matched (`/anything-else`) redirects to `/`.

**On `localhost`** (`localhost`, `127.0.0.1`, `0.0.0.0`), `/` auto-redirects to `/app` so a fresh `npm run dev` install lands on the tool instead of the landing the user just came from. Append `?landing` (e.g. `http://localhost:5173/?landing`) to preview the marketing page locally.

---

## Why?

Most engineers ship with **8–15 SaaS tools**. Each lives behind its own login, dashboard, billing portal, and bookmark. Switching contexts costs minutes per day; tracking which are healthy, which are running, and which keys belong where costs more.

Hangar collapses that into one runway:

- **One click** to any tool's dashboard
- **One vault** for every API token, scoped per tool
- **One place** to see what's pinned, what's connected, and what you're discovering next

It is *not* a SaaS. It is *not* an integration platform. It is a personal control tower you run locally.

---

## Features

### Quick-launch your stack
The top of the page is a horizontal row of tiles for every pinned tool. Click → opens that tool's dashboard in a new tab. Drag the rail (or just scroll) to see the rest. Hidden when your stack is empty so the page doesn't feel sparse.

### Catalog with search & filter
29 built-in tools across 11 categories. Search by name, tagline, or category. Filter via the sidebar nav, or the sticky chip-strip across the top. Switch grid ↔ list view; list view is the default.

The catalog is **collapsed by default** when you have a stack pinned — returning users came here to launch a dashboard, not browse a directory. Click **Browse catalog** to expand. New users with an empty stack see it expanded by default.

### Add your own tools
Click **+ Add tool** at the top of the catalog. Fill in name, dashboard URL, pick a category, optionally tagline + brand color. The tool is saved to your local custom catalog (`hangar-custom-tools` in `localStorage`), auto-pinned to your stack, and from then on works exactly like a built-in entry — pin/unpin, compare, vault keys, the lot. Custom tools have a small `custom` tag in the list view and an X-to-delete on hover.

### My stack modal
Click **My stack** in the top bar for a card view of every pinned tool with summary stats — `tools pinned · categories · connected`. Each card has the tool's brand-coloured top stripe, a 2-line tagline, full pricing string, and three actions:

- **Open** — launches the dashboard
- **Details** — opens the side drawer (with full meta, keys link, recent activity)
- **Unpin** — removes it from your stack

### Tool drawer
Click any card or row to slide in a tool drawer with everything: account URL, docs, full pricing, integrations panel (GitHub today; more soon), and "Pairs well with…" cross-suggestions.

### Compare side-by-side
Pick up to 3 tools using the compare chip on each card. The result bar shows your selection and a **Compare side by side** button → opens a modal with category, what-it-does, and pricing across columns.

### Keys vault
The **Keys** button in the top bar opens a vault for API tokens. Per-tool, multiple keys per tool (each with a label). Reveal/hide each value, copy with one click, delete inline.

> **Stored locally in your browser only.** Anyone with access to this device can read them via DevTools — keep production secrets elsewhere.

### GitHub insights (live)
Add a GitHub Personal Access Token to the vault, then open the GitHub drawer. Hangar fetches your **user profile + 6 most recently pushed repos** straight from `api.github.com`. Skeleton loaders while fetching, real GitHub error messages when the token is wrong.

### Theming
The **cog** at the bottom of the sidebar opens a settings popover with:

- 5 accent colours (Neon green, Ember orange, Violet, Ice blue, Paper monochrome)
- 2 densities (Comfy, Compact)
- 3 card styles (Minimal, Bordered, Glow)

Plus the dark/light toggle next to it. All choices persist to `localStorage`. The popover is portal-rendered into `document.body` so it cleanly escapes the sidebar's overflow context.

### Ask your stack
Hit **⌘⇧A** (or click **✦ Ask** in the topbar) to open a premium chat surface. Claude reaches into your stack via tool-use over your stored vault tokens — read your pinned tools, list recent Vercel deploys, list unresolved Sentry issues, list assigned Linear issues, list GitHub PRs awaiting your review, list recent repos. Browser-direct using your own Anthropic key; no proxy.

Premium UX details: clickable suggested-prompt cards on empty state, tool-call chips above each turn, citations rendered as Stack-Search-style hit cards under each answer, cumulative token + cost meter (Sonnet 4.5 pricing), auto-resizing compose, history persisted in workspace-scoped `localStorage`.

### Stack-wide search
Hit **⌘⇧F** (or click **Search stack** in the footer). One input fans the query out to **GitHub, Vercel, and Linear** in parallel using your stored vault tokens. Results stream in per-provider as each one settles, ranked by recency. ↑↓ to navigate, **Enter** to open the hit in its native dashboard. Each provider self-skips when its token is missing; errors are surfaced inline so a slow or rate-limited tool doesn't block the rest.

### Scan a repo
Open **Settings → Data → Scan a repo**, pick a project folder, and Hangar reads its `package.json` and any `.env` / `.env.local` / `.env.development.local` / `.env.example` files at the root. It maps known package names + env-var patterns to tools in the catalog and shows a checklist:

- Per finding: pin the tool to your stack
- Per env value: import into the vault as a labelled key (skipped for `.env.example` placeholders)

Rules cover ~28 tools — Stripe, Anthropic, OpenAI, Resend, Postmark, Clerk, Auth0, WorkOS, Sentry, PostHog, Datadog, GitHub, Vercel, Linear, Inngest, Trigger, Upstash, Neon, Supabase, MongoDB, PlanetScale, Figma, Sanity, Lemon Squeezy, Cloudflare, Netlify, Fly. `DATABASE_URL` is refined by host (`neon.tech` → Neon, `supabase.` → Supabase, etc.).

Local-first guarantees: read-only handle, no upload, per-pick permission. Uses the **File System Access API**, which today means **Chromium-based browsers** (Chrome, Edge, Brave, Arc, Opera). Firefox and Safari see a graceful fallback.

---

## Quick start

```bash
git clone https://github.com/ClaudevGuy/hangar.git
cd hangar
npm install
npm run dev
```

Open <http://localhost:5173> — on localhost it lands you straight on the tool (`/app`). Append `?landing` to preview the marketing landing locally. Requires Node 18 or newer.

To build for production:

```bash
npm run build      # type-check + bundle to dist/
npm run preview    # serve the dist/ build locally
```

The build is a static folder — host it on any CDN, GitHub Pages, Vercel, Netlify, your own VM. No server-side runtime needed.

---

## How to use

### Pin a tool

1. Click **Browse catalog** to expand the catalog (if collapsed).
2. Search or filter to find the tool.
3. Hover the card and click the **+** chip — or open the drawer and click **Pin to stack**.
4. The tool now appears in your sidebar **My stack** list and the top-of-page quick-launch row.

### Add a tool that isn't in the catalog

1. Open the catalog (**Browse catalog** if collapsed).
2. Click **+ Add tool** in the catalog header.
3. Fill in name + dashboard URL (required), pick a category, optionally add a tagline and brand color. A live preview shows what the card will look like.
4. **Add tool**. The new tool is saved to your local custom catalogue and auto-pinned. Click the small X on its card/row to remove it later — that also un-pins and uncompares it.

### Compare tools

1. Hover a card and click the **compare** icon (the columns icon). Repeat on up to 3 tools.
2. The result bar above the catalog shows your selection.
3. Click **Compare side by side** → modal opens with a comparison grid.

### Store an API key

1. Click the **key icon** at the bottom of the sidebar. The vault modal opens.
2. Switch the segmented filter to **All tools** to find the tool you need.
3. Click **Add a key**, enter a label (e.g. "Personal Access Token"), paste the value, **Save**.
4. The corner badge on the key icon updates with the count.

### Connect GitHub for live insights

1. Visit <https://github.com/settings/tokens> and create a Personal Access Token.
   - Classic PAT with **repo** read scope works for everything.
   - Fine-grained PAT scoped to your account also works.
2. In Hangar, open **Keys** → find GitHub → **Add a key** → paste the PAT → Save.
3. Click the **GitHub** card in the catalog → drawer opens → "Your repos" panel shows your profile and 6 most recently pushed repos (live).

The token is held in your browser's `localStorage` only. It is sent directly from your browser to `api.github.com` (CORS-allowed). It never reaches any other server.

### Customize the look

The bottom of the sidebar holds three icons: the **moon/sun** toggles dark/light mode, the **cog** opens the settings popover (accent colour · density · card style · sync · backup · MCP export · share · scan repo), and the **key** opens the API keys vault. Stays sticky to the bottom of the sidebar's visible scroll viewport.

### Ask your stack

1. Press **⌘⇧A** (Mac) or **Ctrl+Shift+A** (Windows/Linux), or click **✦ Ask** in the topbar.
2. On first open, click one of the four suggested prompt cards — *"What's broken right now?"*, *"What's on my plate?"*, *"How's the deploy looking?"*, *"What does my stack cost?"* — or type your own.
3. Claude calls into your stack via tool-use: `read_stack`, `list_recent_deploys`, `list_unresolved_issues`, `list_assigned_issues`, `list_review_requests`, `list_recent_repos`. Each tool runs browser-direct using the corresponding token in your vault.
4. The answer streams into the conversation with **bold tool names**, tool-call chips for what was queried, and clickable citation cards under each turn linking to the source dashboard.
5. Cumulative token + USD cost meter sits in the header so you can keep an eye on spend.
6. **⌘K** clears the conversation, **Esc** cancels an in-flight run or closes the modal. History persists in `localStorage` (workspace-scoped, 30-turn cap).

Needs an Anthropic API key in the vault. Tools each self-skip when their token is missing — Ask still works, just with whatever subset is connected.

### Search across your connected stack

1. Press **⌘⇧F** (Mac) or **Ctrl+Shift+F** (Windows/Linux), or click **Search stack** in the footer.
2. Type at least 2 characters. The query fires (debounced) against every connected tool.
3. Hits from GitHub (issues, PRs, repos), Vercel (deployments, projects), and Linear (issues) appear together, ranked by recency.
4. Use **↑** / **↓** to highlight a result and **Enter** to open it. Click works too. **Esc** closes.

Each provider only contributes hits if its token is in the vault. Errors are non-fatal — if Linear is unreachable, the GitHub and Vercel results still come through.

### Scan a project repo

1. Click the **cog** in the top bar → switch to the **Data** tab → **Scan a repo**.
2. Pick a project directory. The browser asks for read permission once, for this scan only.
3. Hangar reads `package.json` deps and any `.env*` files at the root, then shows a checklist of detected tools.
4. Toggle which tools to pin and which env values to import into the vault. Click **Adopt selection**.

Read-only and entirely local. No upload, no recursion into subdirectories. The directory handle is held only for this scan. Available in Chromium-based browsers (Chrome, Edge, Brave, Arc, Opera).

---

## Architecture

Vite 5 + React 18 + TypeScript, with `react-router-dom` switching between the marketing landing and the app. No backend. State lives in React + `localStorage`.

```
src/
├── main.tsx                  # routes: / → LandingPage, /app/* → HangarApp
├── styles.css                # global, CSS-custom-property themed
├── types.ts                  # Tool, Prefs, SecretsMap, etc.
├── data/tools.ts             # 29-tool catalog with inline-SVG logos
├── lib/
│   ├── icons.tsx             # inline SVG icon set
│   ├── github.ts             # GitHub REST client
│   └── customTool.ts         # buildCustomTool() + initials-monogram SVG
├── hooks/
│   ├── useStack.ts           # pinned tools (localStorage: hangar-stack)
│   ├── usePrefs.ts           # theme/accent/density/cardstyle (hangar-prefs)
│   ├── useSecrets.ts         # API key vault (hangar-keys)
│   ├── useCustomTools.ts     # user-added catalog entries (hangar-custom-tools)
│   ├── useDragScroll.ts      # mouse drag-to-scroll for rails
│   └── useGitHubData.ts      # fetch + per-token in-memory cache
├── landing/                  # marketing page served at /
│   ├── LandingPage.tsx       # nav + section composition
│   ├── landing.css           # all `.lp-*` styles, themed via the app's CSS vars
│   ├── parts/
│   │   ├── ScrollToTop.tsx   # "Return to tower" floating button (>600px scroll)
│   │   └── ThemeToggle.tsx   # landing-only dark/light toggle (own localStorage key)
│   └── sections/             # Hero, Problem, Features, Catalog, HowItWorks,
│                             # Install, FAQ, FinalCTA, Footer
└── components/
    ├── HangarApp.tsx         # top-level state + composition
    ├── TopBar.tsx            # logo, search, view toggle, theme, settings, vault, stack
    ├── Sidebar.tsx           # categories nav, pinned stack, activity
    ├── ControlDeck.tsx       # quick-launch row + stats panel + Discover rail
    ├── CategoryStrip.tsx     # sticky chip filter
    ├── ResultBar.tsx         # match count + compare tray
    ├── ToolCard.tsx          # grid view card
    ├── ToolRow.tsx           # list view row
    ├── ToolLogo.tsx          # SVG-string logo tile
    ├── ToolDrawer.tsx        # slide-in detail panel
    ├── CompareModal.tsx      # side-by-side comparison grid
    ├── StackModal.tsx        # full pinned-tool overview
    ├── KeysModal.tsx         # API key vault
    ├── AddToolModal.tsx      # form for adding custom tools
    ├── GitHubInsights.tsx    # GitHub user + repos (drawer integration)
    └── SettingsMenu.tsx      # accent/density/card-style popover
```

### Persistence keys

| `localStorage` key | Shape | Set by |
|---|---|---|
| `hangar-stack` | `string[]` of tool ids | `useStack` |
| `hangar-prefs` | `{ theme, accent, density, cardStyle }` | `usePrefs` |
| `hangar-keys` | `{ [toolId]: { id, label, value }[] }` | `useSecrets` |
| `hangar-custom-tools` | `Tool[]` (your added tools) | `useCustomTools` |

To **reset Hangar** to a fresh state, clear those keys in DevTools → Application → Local Storage. Or run in the console:

```js
localStorage.clear(); location.reload();
```

---

## Caveats

- **API keys are stored as plaintext in `localStorage`.** Anyone with access to your browser profile (or DevTools) can read them. Don't paste production secrets into a shared computer.
- **CORS limits how many tools can show live data.** GitHub allows direct browser API calls; most providers (Stripe, Sentry, Vercel write APIs, etc.) don't. Adding live data for more tools likely needs a small server proxy.
- **The catalog is curated, not auto-synced.** Pricing strings come from a static `data/tools.ts` file. If a provider changes their pricing tomorrow, Hangar won't know until someone updates the catalog.

---

## Roadmap

### Shipped recently — beyond the original roadmap

- [x] **Ask your stack** — premium chat surface (⌘⇧A) where Claude calls into your stack via tool-use: read_stack, list_recent_deploys, list_unresolved_issues, list_assigned_issues, list_review_requests, list_recent_repos. Browser-direct using your own Anthropic key. Tool-call chips, citation cards, cumulative cost meter, history persisted in localStorage
- [x] **Sidebar tools rail** — moved theme toggle, settings cog, and Keys vault from the topbar to a sticky bottom rail in the sidebar. Settings popover portal-rendered into `<body>` to escape overflow contexts. Frees significant topbar real estate for stack-action buttons
- [x] **Stack-wide search** — single input fans the query out to GitHub, Vercel and Linear in parallel using your vault tokens. Results stream in per-provider with a debounced + AbortSignal-cancellable orchestrator. ⌘⇧F from anywhere; per-provider dot badges; ↑↓/enter navigation
- [x] **Repo Scanner** — File System Access API reads a project's `package.json` + `.env*` files at the root, infers which tools it uses (28 mapped via package imports + env-var patterns), and offers one-click pin + key import. Local-first, read-only, Chromium browsers only
- [x] **Today panel** — unified incident feed across Vercel/Sentry/Linear, ranked by severity then recency
- [x] **AI Brief** — Claude-powered stack summary in a topbar dropdown. Structured output (status badge, headline, observations, recommended action). Browser-direct, your own Anthropic key
- [x] **AI Action / Investigate** — per-incident `✦` button on Today rows. Claude diagnoses with cross-tool correlation and offers concrete actions (open URL / copy drafted ticket)
- [x] **Quick Actions** — per-incident write-back from the Today panel: resolve / ignore Sentry issues, snooze Linear tickets. Optimistic UI, browser-direct, your own tokens
- [x] **Stack Share** — encode your stack into a URL hash and share publicly. Recipients adopt with one click. Zero-infra: data lives in the URL fragment, never sent to a server
- [x] **Stack Health Radar** — public StatusPage.io endpoints aggregated for pinned providers (26 tools across Hosting/DB/Auth/Code/Jobs/Monitoring/Email/Payments/AI/Design). Compact pill in the topbar; popover for details
- [x] **MCP server** — `mcp/` package with 6 tools so Claude Desktop / Cursor / any MCP client can query your stack (`read_stack`, `list_unresolved_issues`, `list_recent_deploys`, `list_assigned_issues`, `list_review_requests`, `get_recent_revenue`)
- [x] **Keyboard shortcuts** — Linear-style chord system: `g 1-9` to launch pinned tool, `g g` top, `g t` Today, `?` cheat sheet, `/` focus search, `⌘K` command palette, `⌘⇧F` stack search
- [x] **Privacy Policy + Terms of Service** — honest, specific, non-boilerplate. `/privacy` and `/terms`
- [x] **Stack share page at `/share`** — preview + adopt flow with localhost-only adoption to keep data local-first

### Original roadmap

- [x] Custom catalog entries — add tools that aren't in the built-in 29
- [x] Collapsible catalog — defer browsing for returning users
- [x] GitHub live insights from the vault token
- [x] More live integrations beyond GitHub — each behind its own PAT/key in the vault
  - [x] Vercel projects
  - [x] Linear issues
  - [x] Resend deliverability
  - [x] Sentry issues
  - [x] Stripe revenue (via MCP server)
- [x] User-set per-tool plans — Free / Pro / etc., powering a real monthly-cost stat in the deck
- [x] Per-tool last-opened timestamp — "you opened Vercel 2h ago" hint in the stack list
- [x] Edit existing custom tools (was: add + delete only)
- [x] Drag-to-reorder pinned tools in the launcher
- [x] Optional encrypted vault (passphrase-derived AES-GCM) for the API tokens
- [x] Server proxy for CORS-blocked tools (Resend + Sentry, each via a stateless Vercel Function)

### Open

- [ ] Stripe revenue in the web app (currently MCP only)
- [ ] AI cost optimizer — recommend plan changes based on usage patterns
- [ ] Daily Brief auto-generation + email digest via the user's Resend key

---

## AI agent access (MCP)

Hangar ships a Model Context Protocol server in [`mcp/`](mcp/) so local AI agents (Claude Desktop, Cursor, anything that speaks MCP over stdio) can query your stack:

- *"What's in my dev stack?"*
- *"What's broken on Sentry right now?"*
- *"Show me my failed Vercel deploys this week."*
- *"What PRs are waiting on my review?"*
- *"How much Stripe revenue did I make in the last 30 days?"*

Six tools today: `read_stack`, `list_unresolved_issues` (Sentry), `list_recent_deploys` (Vercel), `list_assigned_issues` (Linear), `list_review_requests` (GitHub), `get_recent_revenue` (Stripe). All token-scoped via env vars; no token = that tool errors but the rest still work.

The dashboard has a **Settings → AI agents → Download mcp.json** button so the stack config stays in sync with your pinned tools / plans without hand-editing the JSON. See [mcp/README.md](mcp/README.md) for full setup.

---

## Tech stack

- **Vite 5** — dev server + bundler
- **React 18** — UI
- **TypeScript** — strict, noUnusedLocals, noUnusedParameters
- **Geist** + **Geist Mono** + **Bricolage Grotesque** — typefaces (Google Fonts)
- **No external state library** — React hooks + `localStorage` carry it
- **No CSS framework** — single hand-written `styles.css` (~1k lines) with CSS custom properties for theming

---

## Origin

Built from a [Claude Design](https://claude.ai/design) HTML/CSS/JS prototype handoff. The original prototype's `Hangar.html` lived alongside `app.jsx`, `styles.css`, `tools-data.js`, and `tweaks-panel.jsx` — all React-via-CDN with Babel-standalone in the browser. This repo is the production-grade port: typed components, a real build, and feature additions (Keys vault, GitHub insights, custom tools, drag-scroll rails, settings popover, stack modal) on top of the original design.

---

## License

MIT — do whatever, no warranty. See `LICENSE` (add one if you fork).
