# Hangar

Your dev tool control tower — pin the SaaS tools you actually ship with, jump into their dashboards from one runway, and keep your API keys & live status close at hand.

## Run

```bash
npm install
npm run dev    # http://localhost:5173/
npm run build  # type-check + bundle to dist/
```

Requires Node 18+.

## What's in it

- **Catalog** — 29 dev tools across 11 categories (Hosting, DB, Auth, AI, etc.) with one-click "Open" to each tool's dashboard.
- **My stack** — pin tools you use; persisted to `localStorage`. The 4-stat header summarises pinned count, live status, monthly recurring spend, and total catalog size.
- **Compare** — pick up to 3 tools, get a side-by-side card view of category, plan, pricing, and status.
- **Keys vault** — store API tokens per tool from the top-bar **Keys** button. **Local only — keys never leave your browser.**
- **GitHub insights** — when a Personal Access Token is in the vault, the GitHub drawer shows your latest 6 repos (live from `api.github.com`).
- **Settings** — dark/light, 5 accent colours, density, card style. Drag-scroll on the trending and category strips.

## Architecture

Vite + React 18 + TypeScript. No backend. State lives in React + `localStorage` (`hangar-stack`, `hangar-prefs`, `hangar-keys`).

```
src/
├── main.tsx
├── styles.css            # global, CSS-custom-property themed
├── data/tools.ts         # 29-tool catalog with inline-SVG logos
├── lib/
│   ├── icons.tsx
│   └── github.ts         # GitHub REST client
├── hooks/
│   ├── useStack.ts       # pinned tools
│   ├── usePrefs.ts       # theme/accent/density/cardstyle
│   ├── useSecrets.ts     # API key vault
│   ├── useDragScroll.ts  # mouse drag-to-scroll for rails
│   └── useGitHubData.ts  # fetch + per-token cache
└── components/           # HangarApp, TopBar, Sidebar, ControlDeck,
                          # ToolCard/Row, ToolDrawer, CompareModal,
                          # KeysModal, GitHubInsights, SettingsMenu
```

## Caveats

- **API keys are stored in `localStorage` as plain text.** Anyone with access to this browser profile can read them via DevTools. Don't paste production secrets into a shared computer.
- **CORS limits the live-data slice.** GitHub allows direct browser API calls; most other providers don't. Adding live data for more tools likely needs a server.

## Origin

Built from a [Claude Design](https://claude.ai/design) HTML/CSS/JS prototype handoff. The original handoff bundle lives at `../Hangar 2.0-handoff.zip` for reference.
