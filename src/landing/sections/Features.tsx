import { findTool } from "../LandingPage";

const PAIR_IDS = ["neon", "resend", "sentry", "clerk", "inngest", "stripe", "posthog", "anthropic"];
const LAUNCH_IDS = ["github", "vercel", "stripe", "clerk"];
const FILTER_IDS = [
  "vercel", "clerk", "github", "neon", "auth0", "resend",
  "workos", "stripe", "sentry", "figma", "anthropic", "linear",
];
const ACTIVITY = [
  { id: "vercel", text: "Deployment succeeded · main", time: "2m" },
  { id: "github", text: "Pushed 3 commits to main", time: "8m" },
  { id: "sentry", text: "1 new issue in production", time: "34m" },
  { id: "stripe", text: "12 new subscriptions today", time: "1h" },
  { id: "clerk", text: "47 new sign-ups", time: "4h" },
];
const ORBIT_IDS = ["vercel", "neon", "clerk", "resend", "stripe", "github"];

export function Features() {
  return (
    <section id="features">
      <div className="lp-wrap">
        <div className="lp-sec-head">
          <div className="lp-sec-eyebrow">What's inside</div>
          <h2 className="lp-sec-title">
            A control tower, <span className="lp-soft">not another dashboard.</span>
          </h2>
          <p className="lp-sec-sub">
            Thirteen small things that, together, replace the chaos of bookmark folders, password
            managers and "uhh let me find the link."
          </p>
        </div>

        <div className="lp-features-grid">
          <article className="lp-feature lp-span-3">
            <div className="lp-feature-num">01 / Pin</div>
            <h3 className="lp-feature-title">
              Build your stack by pinning the tools you actually use.
            </h3>
            <p className="lp-feature-desc">
              No quizzes, no questionnaires. Click the + on any tool. It moves to the front of the
              runway, with your plan, status and last activity.
            </p>
            <div className="lp-feature-visual">
              <div className="lp-demo-launch">
                {LAUNCH_IDS.map((id) => {
                  const t = findTool(id);
                  if (!t) return null;
                  return (
                    <div key={id} className="lp-demo-launch-row">
                      <div
                        className="lp-tool-logo"
                        style={{ background: t.bg, color: t.color }}
                        dangerouslySetInnerHTML={{ __html: t.logo }}
                      />
                      <span style={{ fontWeight: 500 }}>{t.name}</span>
                      <span className="lp-cat">{t.category}</span>
                      <span className="lp-arrow">OPEN ↗</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </article>

          <article className="lp-feature lp-span-3">
            <div className="lp-feature-num">02 / Filter</div>
            <h3 className="lp-feature-title">
              Real-time search across thirty tools and ten categories.
            </h3>
            <p className="lp-feature-desc">
              Type "auth" and the grid reflows. Search by what it does, not what it's called. The
              catalog lives in your head; finding things should too.
            </p>
            <div className="lp-feature-visual">
              <div className="lp-demo-filter">
                <div className="lp-demo-filter-search">
                  <span>$ filter</span>
                  <span>auth</span>
                  <span className="lp-cursor" />
                </div>
                <div className="lp-demo-filter-results">
                  {FILTER_IDS.map((id) => {
                    const t = findTool(id);
                    if (!t) return null;
                    const matches = t.category === "Auth";
                    return (
                      <div
                        key={id}
                        className={`lp-demo-filter-tile ${matches ? "match" : "miss"}`}
                        style={{ color: t.color }}
                        dangerouslySetInnerHTML={{ __html: t.logo }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </article>

          <article className="lp-feature lp-span-2">
            <div className="lp-feature-num">03 / Activity</div>
            <h3 className="lp-feature-title">Cross-tool feed.</h3>
            <p className="lp-feature-desc">
              Deploys, errors, sign-ups, payments — pulled from every connected tool into one feed.
            </p>
            <div className="lp-feature-visual">
              <div className="lp-demo-activity">
                {ACTIVITY.map((a, i) => {
                  const t = findTool(a.id);
                  if (!t) return null;
                  return (
                    <div key={i} className="lp-demo-activity-row">
                      <div
                        className="lp-tool-logo"
                        style={{ background: t.bg, color: t.color }}
                        dangerouslySetInnerHTML={{ __html: t.logo }}
                      />
                      <span>{a.text}</span>
                      <span className="lp-time">{a.time}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </article>

          <article className="lp-feature lp-span-2">
            <div className="lp-feature-num">04 / Compare</div>
            <h3 className="lp-feature-title">Side-by-side, two clicks.</h3>
            <p className="lp-feature-desc">
              Pricing, plans, features. Stop tab-flipping when you're picking a database.
            </p>
            <div className="lp-feature-visual">
              <div className="lp-demo-compare">
                {["neon", "supabase"].map((id) => {
                  const t = findTool(id);
                  if (!t) return null;
                  const [free, pro] = t.pricing.split("·").map((s) => s.trim());
                  return (
                    <div key={id} className="lp-demo-compare-col">
                      <div className="lp-demo-compare-top">
                        <div
                          className="lp-tool-logo"
                          style={{ background: t.bg, color: t.color }}
                          dangerouslySetInnerHTML={{ __html: t.logo }}
                        />
                        {t.name}
                      </div>
                      <div className="lp-demo-compare-row">
                        <span className="lp-lbl">Free</span>
                        <span>{free || "—"}</span>
                      </div>
                      <div className="lp-demo-compare-row">
                        <span className="lp-lbl">Pro</span>
                        <span>{pro || "—"}</span>
                      </div>
                      <div className="lp-demo-compare-row">
                        <span className="lp-lbl">Cat</span>
                        <span>{t.category}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </article>

          <article className="lp-feature lp-span-2">
            <div className="lp-feature-num">05 / Launch</div>
            <h3 className="lp-feature-title">One click into any account.</h3>
            <p className="lp-feature-desc">
              Hangar deep-links straight to your dashboard, not the marketing site. Bookmarks,
              retired.
            </p>
            <div className="lp-feature-visual">
              <div className="lp-demo-ring">
                <div className="lp-demo-ring-center">YOU</div>
                <div className="lp-demo-ring-orbit">
                  {ORBIT_IDS.map((id, i) => {
                    const t = findTool(id);
                    if (!t) return null;
                    const angle = (i / ORBIT_IDS.length) * Math.PI * 2 - Math.PI / 2;
                    const r = 80;
                    const x = Math.cos(angle) * r;
                    const y = Math.sin(angle) * r;
                    return (
                      <div
                        key={id}
                        className="lp-demo-ring-tool"
                        style={{
                          transform: `translate(${x}px, ${y}px)`,
                          background: t.bg,
                          color: t.color,
                        }}
                        dangerouslySetInnerHTML={{ __html: t.logo }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </article>

          <article className="lp-feature lp-span-3">
            <div className="lp-feature-num">06 / Spend</div>
            <h3 className="lp-feature-title">
              See what your stack actually costs every month.
            </h3>
            <p className="lp-feature-desc">
              Tag yourself on each tool's plan — Free, Pro, Team — and Hangar rolls up the real
              monthly total across your stack. Catch the "$19/mo" subscription you forgot about
              three product launches ago.
            </p>
            <div className="lp-feature-visual">
              <svg width="100%" viewBox="0 0 400 100" style={{ overflow: "visible" }}>
                <defs>
                  <linearGradient id="lpSpendGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <path
                  d="M0,80 L40,72 L80,76 L120,60 L160,64 L200,40 L240,48 L280,30 L320,38 L360,20 L400,28 L400,100 L0,100 Z"
                  fill="url(#lpSpendGrad)"
                />
                <path
                  d="M0,80 L40,72 L80,76 L120,60 L160,64 L200,40 L240,48 L280,30 L320,38 L360,20 L400,28"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth={1.5}
                />
                <text x={0} y={14} fontFamily="var(--font-mono)" fontSize={9} fill="var(--text-3)">
                  JAN
                </text>
                <text x={370} y={14} fontFamily="var(--font-mono)" fontSize={9} fill="var(--text-3)">
                  DEC
                </text>
                <text
                  x={200}
                  y={14}
                  fontFamily="var(--font-mono)"
                  fontSize={9}
                  fill="var(--accent)"
                  textAnchor="middle"
                >
                  $184/mo · +12%
                </text>
              </svg>
            </div>
          </article>

          <article className="lp-feature lp-span-3">
            <div className="lp-feature-num">07 / Pairs well with</div>
            <h3 className="lp-feature-title">
              Suggestions from devs who built things you'd recognize.
            </h3>
            <p className="lp-feature-desc">
              Pin Vercel and Hangar quietly nudges you toward Neon, Resend and Sentry — the rest of
              the stack the people who ship Next.js apps actually run. No upsell. No affiliate
              sludge.
            </p>
            <div className="lp-feature-visual">
              <div className="lp-pairs-grid">
                {PAIR_IDS.map((id) => {
                  const t = findTool(id);
                  if (!t) return null;
                  return (
                    <div key={id} className="lp-hero-tool lp-pair">
                      <div
                        className="lp-tool-logo"
                        style={{ background: t.bg, color: t.color }}
                        dangerouslySetInnerHTML={{ __html: t.logo }}
                      />
                      <span>{t.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </article>

          <article className="lp-feature lp-span-6">
            <div className="lp-feature-num">08 / AI agents</div>
            <h3 className="lp-feature-title">
              Your AI assistants already know your stack.
            </h3>
            <p className="lp-feature-desc">
              Hangar ships a Model Context Protocol server. Plug it into Claude Desktop or Cursor and
              your AI sees your pinned tools, deploy status, unresolved errors, Linear queue, GitHub
              review backlog, and Stripe revenue — without you pasting any of it into a chat.
            </p>
            <div className="lp-feature-visual">
              <div className="lp-mcp-grid">
                {MCP_PROMPTS.map((p) => (
                  <div key={p.tool} className="lp-mcp-row">
                    <span className="lp-mcp-tool">{p.tool}</span>
                    <span className="lp-mcp-arrow">↦</span>
                    <span className="lp-mcp-q">"{p.q}"</span>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <article className="lp-feature lp-span-3">
            <div className="lp-feature-num">09 / Today</div>
            <h3 className="lp-feature-title">
              One feed for everything that's broken.
            </h3>
            <p className="lp-feature-desc">
              Failed deploys, unresolved Sentry issues, urgent Linear tickets — all aggregated into
              one ranked list at the top of the dashboard. Public status pages get pulled in too, so
              you know if it's <em>your</em> problem or your provider's.
            </p>
            <div className="lp-feature-visual">
              <div className="lp-demo-today">
                {TODAY_MOCK.map((row) => (
                  <div key={row.title} className={`lp-demo-today-row sev-${row.sev}`}>
                    <span className="lp-demo-today-dot" />
                    <span className="lp-demo-today-title">{row.title}</span>
                    <span className="lp-demo-today-time">{row.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <article className="lp-feature lp-span-3">
            <div className="lp-feature-num">10 / Brief</div>
            <h3 className="lp-feature-title">
              A 9 a.m. briefing on your stack.
            </h3>
            <p className="lp-feature-desc">
              One click in the topbar — Hangar pipes your live deploy/issue/ticket data through Claude
              and returns a structured briefing: status, headline, three observations, and a
              recommended action. Browser-direct using your own Anthropic key, never through us.
            </p>
            <div className="lp-feature-visual">
              <div className="lp-demo-brief">
                <div className="lp-demo-brief-status">
                  <span className="lp-demo-brief-dot" />
                  <span>WATCH</span>
                </div>
                <p className="lp-demo-brief-headline">
                  <strong>Vercel</strong> v2.4.1 deployed 18 minutes before this <strong>Sentry</strong> error first appeared.
                </p>
                <ul className="lp-demo-brief-obs">
                  <li>1 new error · 12 users affected</li>
                  <li>Stack trace points to checkout.tsx</li>
                </ul>
              </div>
            </div>
          </article>

          <article className="lp-feature lp-span-6">
            <div className="lp-feature-num">11 / Stack Share</div>
            <h3 className="lp-feature-title">
              Share your stack with one URL. No backend, no signup.
            </h3>
            <p className="lp-feature-desc">
              Hit <strong>Share my stack</strong> in Settings and Hangar encodes your tools, plans,
              and metadata into the URL hash fragment of a public link. Tweet it. Slack it. The
              recipient lands on a preview page and can adopt the whole stack with one click. The
              data lives in the URL itself — browsers never send fragments to servers, so the share
              never touches Hangar infrastructure.
            </p>
            <div className="lp-feature-visual">
              <div className="lp-demo-share">
                <div className="lp-demo-share-url">
                  <span className="lp-demo-share-host">hangar-silk.vercel.app/share#data=</span>
                  <span className="lp-demo-share-hash">eyJ2IjoxLCJ0aXRsZSI6Ik15IFNhYVMgc3RhY2si…</span>
                </div>
                <div className="lp-demo-share-preview">
                  <span className="lp-demo-share-eyebrow">A shared Hangar stack</span>
                  <span className="lp-demo-share-title">My SaaS stack <span className="lp-soft">· by @danvg</span></span>
                  <span className="lp-demo-share-stats">8 tools · 4 plans tagged</span>
                </div>
              </div>
            </div>
          </article>

          <article className="lp-feature lp-span-3">
            <div className="lp-feature-num">12 / Scan</div>
            <h3 className="lp-feature-title">
              Hangar reads your repo and builds your stack.
            </h3>
            <p className="lp-feature-desc">
              Pick a project folder. Hangar parses <code className="lp-code">package.json</code>{" "}
              and <code className="lp-code">.env</code>, infers which tools you're already using,
              and offers one-click pin + key import. Local-first, read-only, browser only. The
              fastest first-day onboarding in any dashboard.
            </p>
            <div className="lp-feature-visual">
              <div className="lp-demo-scan">
                <div className="lp-demo-scan-path">~/projects/acme-saas</div>
                <div className="lp-demo-scan-list">
                  {SCAN_DETECTED.map(({ id, evidence }) => {
                    const t = findTool(id);
                    if (!t) return null;
                    return (
                      <div key={id} className="lp-demo-scan-row">
                        <div
                          className="lp-tool-logo"
                          style={{ background: t.bg, color: t.color }}
                          dangerouslySetInnerHTML={{ __html: t.logo }}
                        />
                        <span className="lp-demo-scan-name">{t.name}</span>
                        <span className="lp-demo-scan-evidence">{evidence}</span>
                        <span className="lp-demo-scan-check">✓</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </article>

          <article className="lp-feature lp-span-3">
            <div className="lp-feature-num">13 / Search</div>
            <h3 className="lp-feature-title">
              One input. Every connected tool.
            </h3>
            <p className="lp-feature-desc">
              <code className="lp-code">⌘⇧F</code> from anywhere. Hangar fans your query out to
              GitHub, Vercel and Linear in parallel using your vault tokens. Results stream in by
              recency. Stop remembering which tool the thing lived in.
            </p>
            <div className="lp-feature-visual">
              <div className="lp-demo-search">
                <div className="lp-demo-search-input">
                  <span className="lp-demo-search-icon">⌕</span>
                  <span className="lp-demo-search-q">checkout</span>
                  <span className="lp-cursor" />
                </div>
                <div className="lp-demo-search-results">
                  {SEARCH_HITS.map((hit, i) => {
                    const t = findTool(hit.id);
                    if (!t) return null;
                    return (
                      <div key={i} className="lp-demo-search-row">
                        <div
                          className="lp-tool-logo"
                          style={{ background: t.bg, color: t.color }}
                          dangerouslySetInnerHTML={{ __html: t.logo }}
                        />
                        <div className="lp-demo-search-body">
                          <span className="lp-demo-search-title">{hit.title}</span>
                          <span className="lp-demo-search-sub">
                            <span className="lp-demo-search-type">{hit.type}</span>
                            {" · "}{hit.time}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

const SCAN_DETECTED: { id: string; evidence: string }[] = [
  { id: "anthropic", evidence: "pkg @anthropic-ai/sdk" },
  { id: "stripe",    evidence: "env STRIPE_SECRET_KEY" },
  { id: "neon",      evidence: "env DATABASE_URL · neon.tech" },
  { id: "resend",    evidence: "pkg resend" },
  { id: "sentry",    evidence: "pkg @sentry/nextjs" },
];

const SEARCH_HITS: { id: string; type: string; title: string; time: string }[] = [
  { id: "linear",  type: "issue",  title: "HAN-87 · Fix checkout retry loop",   time: "12m" },
  { id: "github",  type: "pr",     title: "checkout: handle 402 from Stripe",   time: "1h"  },
  { id: "vercel",  type: "deploy", title: "checkout: 3.4s prod deploy",         time: "2h"  },
  { id: "sentry",  type: "issue",  title: "TypeError in checkout.tsx",          time: "6h"  },
];

const TODAY_MOCK: { title: string; sev: "critical" | "warning" | "info"; time: string }[] = [
  { title: "hangar · deploy failed", sev: "critical", time: "12m" },
  { title: "TypeError in checkout.tsx · 47 events", sev: "critical", time: "1h" },
  { title: "HAN-12 · Fix login redirect (urgent)", sev: "critical", time: "2h" },
  { title: "Vercel: investigating elevated 5xx", sev: "warning", time: "now" },
];

const MCP_PROMPTS: { tool: string; q: string }[] = [
  { tool: "read_stack",             q: "What's in my dev stack?" },
  { tool: "list_unresolved_issues", q: "Anything broken on Sentry?" },
  { tool: "list_recent_deploys",    q: "Failed Vercel deploys this week?" },
  { tool: "list_assigned_issues",   q: "What's on my Linear queue?" },
  { tool: "list_review_requests",   q: "PRs waiting on my review?" },
  { tool: "get_recent_revenue",     q: "How much Stripe revenue this month?" },
];
