# Hangar

> The dev's control tower. Pin the SaaS tools you actually ship with, jump to their dashboards in one click, vault your API keys, and watch your stack from one runway.

**Live site:** <https://hangar-silk.vercel.app/>

Hangar is a single-page React app that ships with a 29-tool catalogue across 11 categories — Vercel, Neon, Stripe, Anthropic, Sentry, Linear, Figma, and friends — and lets you **add any tool that isn't on the list yourself**. Pin the ones you use, store API keys per tool, and over time get live data straight from each provider (GitHub repos already, more to come).

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
The top-bar **cog** opens a settings popover with:

- 5 accent colours (Neon green, Ember orange, Violet, Ice blue, Paper monochrome)
- 2 densities (Comfy, Compact)
- 3 card styles (Minimal, Bordered, Glow)

Plus the dark/light toggle next to it. All choices persist to `localStorage`.

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

1. Click **Keys** in the top bar. The vault modal opens.
2. Switch the segmented filter to **All tools** to find the tool you need.
3. Click **Add a key**, enter a label (e.g. "Personal Access Token"), paste the value, **Save**.
4. The Keys pill in the top bar updates with the count.

### Connect GitHub for live insights

1. Visit <https://github.com/settings/tokens> and create a Personal Access Token.
   - Classic PAT with **repo** read scope works for everything.
   - Fine-grained PAT scoped to your account also works.
2. In Hangar, open **Keys** → find GitHub → **Add a key** → paste the PAT → Save.
3. Click the **GitHub** card in the catalog → drawer opens → "Your repos" panel shows your profile and 6 most recently pushed repos (live).

The token is held in your browser's `localStorage` only. It is sent directly from your browser to `api.github.com` (CORS-allowed). It never reaches any other server.

### Customize the look

Click the **cog** in the top bar (right of the theme toggle). Pick an accent colour, density, and card style. The dark/light toggle is the sun/moon icon next to the cog.

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

- [x] Custom catalog entries — add tools that aren't in the built-in 29
- [x] Collapsible catalog — defer browsing for returning users
- [x] GitHub live insights from the vault token
- [x] More live integrations beyond GitHub — each behind its own PAT/key in the vault
  - [x] Vercel projects
  - [x] Linear issues
  - [x] Resend deliverability
  - [x] Sentry issues
  - [ ] Stripe revenue
- [x] User-set per-tool plans — Free / Pro / etc., powering a real monthly-cost stat in the deck
- [x] Per-tool last-opened timestamp — "you opened Vercel 2h ago" hint in the stack list
- [x] Edit existing custom tools (was: add + delete only)
- [x] Drag-to-reorder pinned tools in the launcher
- [x] Optional encrypted vault (passphrase-derived AES-GCM) for the API tokens
- [ ] Generalized server proxy for CORS-blocked tools (currently: Resend only, via Vercel Function)

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
