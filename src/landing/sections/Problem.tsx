import { findTool } from "../LandingPage";

const TAB_IDS = ["vercel", "github", "stripe", "sentry", "linear", "figma"] as const;
const TAB_POSITIONS = [
  { x: 0, y: 0, r: -8 },
  { x: 80, y: 30, r: 4 },
  { x: 30, y: 90, r: -4 },
  { x: 110, y: 130, r: 6 },
  { x: 60, y: 180, r: -3 },
  { x: 140, y: 60, r: 9 },
];

const SOLUTION_IDS = [
  "vercel", "github", "neon", "clerk", "resend", "stripe",
  "sentry", "anthropic", "figma", "linear", "posthog", "inngest",
];

const LIVE_IDS = new Set(["vercel", "github", "neon", "clerk", "resend", "sentry", "stripe", "anthropic", "figma", "posthog"]);

export function Problem() {
  return (
    <section className="lp-problem">
      <div className="lp-wrap">
        <div className="lp-sec-head">
          <div className="lp-sec-eyebrow">The mess</div>
          <h2 className="lp-sec-title">
            28 tabs open.<br />
            <span className="lp-soft">Three forgotten subscriptions.</span>
            <br />
            <span className="lp-soft">One panicked search for the Stripe dashboard.</span>
          </h2>
        </div>

        <div className="lp-problem-grid">
          <div>
            <div className="lp-tabs-stack">
              {TAB_IDS.map((id, i) => {
                const t = findTool(id);
                const pos = TAB_POSITIONS[i];
                if (!t) return null;
                return (
                  <div
                    key={id}
                    className="lp-tab-card"
                    style={{
                      left: pos.x,
                      top: pos.y,
                      transform: `rotate(${pos.r}deg)`,
                      zIndex: i,
                    }}
                  >
                    <div className="lp-browser-bar">
                      <span /><span /><span />
                      <span className="lp-browser-url">
                        {t.accountUrl.replace("https://", "")}
                      </span>
                    </div>
                    <div className="lp-tab-logo-row">
                      <div
                        className="lp-tool-logo"
                        style={{ background: t.bg, color: t.color, width: 24, height: 24 }}
                        dangerouslySetInnerHTML={{ __html: t.logo }}
                      />
                      <div className="lp-tab-name">{t.name}</div>
                    </div>
                    <div className="lp-tab-meta">{t.category}</div>
                  </div>
                );
              })}
            </div>
            <div className="lp-problem-stat">
              <div className="lp-problem-stat-num">$840</div>
              <div className="lp-problem-stat-text">
                average yearly spend on dev tools the developer forgot they were paying for.
              </div>
            </div>
          </div>

          <div>
            <div className="lp-solution-card">
              <div className="lp-solution-card-head">
                <span className="lp-pulse" />
                Hangar · all live
              </div>
              <div className="lp-solution-grid">
                {SOLUTION_IDS.map((id) => {
                  const t = findTool(id);
                  if (!t) return null;
                  return (
                    <div key={id} className="lp-sg-tool">
                      {LIVE_IDS.has(id) && <span className="lp-live-dot" />}
                      <div
                        className="lp-tool-logo"
                        style={{ background: t.bg, color: t.color }}
                        dangerouslySetInnerHTML={{ __html: t.logo }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="lp-sec-sub" style={{ marginTop: 32 }}>
              One screen. Real logos. Real account links. Live status from each provider. Pin what
              you use, archive what you don't, jump in with one click.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
