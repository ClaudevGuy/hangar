# Hangar

> The dev's control tower. Pin the SaaS tools you actually ship with, jump to their dashboards in one click, vault your API keys, and watch your stack from one runway.

<!-- Drop a hero screenshot at docs/screenshots/hero.png and the line below will render it.
     See "Capturing screenshots" at the bottom for a one-liner. -->

![Hangar — main view](docs/screenshots/hero.png)

Hangar is a single-page React app that catalogues 29 dev tools across 11 categories — Vercel, Neon, Stripe, Anthropic, Sentry, Linear, Figma, and friends. Pin the ones you use, store API keys per tool, and over time get live data straight from each provider (GitHub repos already, more to come).

It runs entirely in your browser. No backend, no telemetry, no analytics. Your stack and your keys live in `localStorage` only.

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
The top of the page is a horizontal row of tiles for every pinned tool. Click → opens that tool's dashboard in a new tab. Drag the rail (or just scroll) to see the rest.

![Quick-launch row](docs/screenshots/quicklaunch.png)

### Catalog with search & filter
29 tools, 11 categories. Search by name, tagline, or category. Filter via the sidebar nav, or the sticky chip-strip across the top. Switch grid ↔ list view; list view is the default.

![Catalog list view](docs/screenshots/catalog.png)

### My stack modal
Click **My stack** in the top bar for a card view of every pinned tool with summary stats — `tools pinned · categories · connected`. Each card has the tool's brand-coloured top stripe, a 2-line tagline, full pricing string, and three actions:

- **Open** — launches the dashboard
- **Details** — opens the side drawer (with full meta, keys link, recent activity)
- **Unpin** — removes it from your stack

![My stack modal](docs/screenshots/stack.png)

### Tool drawer
Click any card or row to slide in a tool drawer with everything: account URL, docs, full pricing, integrations panel (GitHub today; more soon), and "Pairs well with…" cross-suggestions.

![Tool drawer](docs/screenshots/drawer.png)

### Compare side-by-side
Pick up to 3 tools using the compare chip on each card. The result bar shows your selection and a **Compare side by side** button → opens a modal with category, what-it-does, pricing, plan, and status across columns.

![Compare modal](docs/screenshots/compare.png)

### Keys vault
The **Keys** button in the top bar opens a vault for API tokens. Per-tool, multiple keys per tool (each with a label). Reveal/hide each value, copy with one click, delete inline.

> **Stored locally in your browser only.** Anyone with access to this device can read them via DevTools — keep production secrets elsewhere.

![Keys vault](docs/screenshots/keys.png)

### GitHub insights (live)
Add a GitHub Personal Access Token to the vault, then open the GitHub drawer. Hangar fetches your **user profile + 6 most recently pushed repos** straight from `api.github.com`. Skeleton loaders while fetching, real GitHub error messages when the token is wrong.

![GitHub insights](docs/screenshots/github.png)

### Theming
The top-bar **cog** opens a settings popover with:

- 5 accent colours (Neon green, Ember orange, Violet, Ice blue, Paper monochrome)
- 2 densities (Comfy, Compact)
- 3 card styles (Minimal, Bordered, Glow)

Plus the dark/light toggle next to it. All choices persist to `localStorage`.

![Settings popover](docs/screenshots/settings.png)

---

## Quick start

```bash
git clone https://github.com/ClaudevGuy/hangar.git
cd hangar
npm install
npm run dev
```

Open <http://localhost:5173>. Requires Node 18 or newer.

To build for production:

```bash
npm run build      # type-check + bundle to dist/
npm run preview    # serve the dist/ build locally
```

The build is a static folder — host it on any CDN, GitHub Pages, Vercel, Netlify, your own VM. No server-side runtime needed.

---

## How to use

### Pin a tool

1. Find a tool in the catalog (search or filter).
2. Hover the card and click the **+** chip — or open the drawer and click **Pin to stack**.
3. The tool now appears in your sidebar **My stack** list and the top-of-page quick-launch row.

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

Vite 5 + React 18 + TypeScript. No backend. State lives in React + `localStorage`.

```
src/
├── main.tsx
├── styles.css                # global, CSS-custom-property themed
├── types.ts                  # Tool, Prefs, SecretsMap, etc.
├── data/tools.ts             # 29-tool catalog with inline-SVG logos
├── lib/
│   ├── icons.tsx             # inline SVG icon set
│   └── github.ts             # GitHub REST client
├── hooks/
│   ├── useStack.ts           # pinned tools (localStorage: hangar-stack)
│   ├── usePrefs.ts           # theme/accent/density/cardstyle (hangar-prefs)
│   ├── useSecrets.ts         # API key vault (hangar-keys)
│   ├── useDragScroll.ts      # mouse drag-to-scroll for rails
│   └── useGitHubData.ts      # fetch + per-token in-memory cache
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
    ├── GitHubInsights.tsx    # GitHub user + repos (drawer integration)
    └── SettingsMenu.tsx      # accent/density/card-style popover
```

### Persistence keys

| `localStorage` key | Shape | Set by |
|---|---|---|
| `hangar-stack` | `string[]` of tool ids | `useStack` |
| `hangar-prefs` | `{ theme, accent, density, cardStyle }` | `usePrefs` |
| `hangar-keys` | `{ [toolId]: { id, label, value }[] }` | `useSecrets` |

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

- [ ] More live integrations beyond GitHub (Vercel projects, Linear issues, Stripe revenue, Sentry issues — each behind their own PAT/key in the vault)
- [ ] Custom catalog entries — let users add tools that aren't in the built-in 29
- [ ] User-set per-tool plans — flag yourself as Free/Pro on a tool so monthly-cost stats are real instead of guessed
- [ ] Per-tool last-opened timestamp — surface "you opened Vercel 2h ago" for quick re-launching
- [ ] Optional encrypted vault (passphrase-derived key) for the API tokens
- [ ] Optional server proxy (Vercel Functions / Cloudflare Worker) for tools that don't allow browser CORS

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

Built from a [Claude Design](https://claude.ai/design) HTML/CSS/JS prototype handoff. The original prototype's `Hangar.html` lived alongside `app.jsx`, `styles.css`, `tools-data.js`, and `tweaks-panel.jsx` — all React-via-CDN with Babel-standalone in the browser. This repo is the production-grade port: typed components, a real build, and feature additions (Keys vault, GitHub insights, drag-scroll rails, settings popover, stack modal) on top of the original design.

---

## Capturing screenshots

The README references images in `docs/screenshots/`. To populate them yourself:

1. `npm run dev` and open <http://localhost:5173>.
2. For each shot, set up the state you want (pin a few tools, open a modal, etc.). To bootstrap a representative state, paste this in the browser console:

   ```js
   localStorage.setItem('hangar-stack', JSON.stringify([
     'github','vercel','neon','anthropic','linear','stripe','figma'
   ]));
   localStorage.setItem('hangar-keys', JSON.stringify({
     github: [{ id: 'demo', label: 'PAT', value: 'paste-a-real-or-placeholder-token' }],
   }));
   location.reload();
   ```

3. Take browser screenshots (Mac: ⌘⇧4, Windows: Win+Shift+S) and save them as:
   - `docs/screenshots/hero.png` — full page after the seed above
   - `docs/screenshots/quicklaunch.png` — close-up of the Your-stack row
   - `docs/screenshots/catalog.png` — list view with category filtered
   - `docs/screenshots/stack.png` — My stack modal open
   - `docs/screenshots/drawer.png` — any tool drawer open
   - `docs/screenshots/compare.png` — compare modal with 2–3 tools
   - `docs/screenshots/keys.png` — Keys vault modal
   - `docs/screenshots/github.png` — GitHub drawer with insights panel
   - `docs/screenshots/settings.png` — Settings popover open

The README's image links use those exact filenames as relative paths, so once they're in `docs/screenshots/` the README renders correctly on GitHub.

---

## License

MIT — do whatever, no warranty. See `LICENSE` (add one if you fork).
