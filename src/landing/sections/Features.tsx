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
            Six small things that, together, replace the chaos of bookmark folders, password
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
        </div>
      </div>
    </section>
  );
}

const MCP_PROMPTS: { tool: string; q: string }[] = [
  { tool: "read_stack",             q: "What's in my dev stack?" },
  { tool: "list_unresolved_issues", q: "Anything broken on Sentry?" },
  { tool: "list_recent_deploys",    q: "Failed Vercel deploys this week?" },
  { tool: "list_assigned_issues",   q: "What's on my Linear queue?" },
  { tool: "list_review_requests",   q: "PRs waiting on my review?" },
  { tool: "get_recent_revenue",     q: "How much Stripe revenue this month?" },
];
