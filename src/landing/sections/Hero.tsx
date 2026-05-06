import { findTool } from "../LandingPage";

const HERO_IDS = [
  "github", "vercel", "neon", "clerk", "resend", "stripe",
  "sentry", "anthropic", "figma", "linear", "posthog", "inngest",
];

export function Hero() {
  return (
    <header className="lp-hero" id="top">
      <div className="lp-hero-bg" />
      <div className="lp-hero-glow" />
      <div className="lp-hero-inner">
        <span className="lp-eyebrow">
          <span className="lp-pulse" />
          Now in private preview
        </span>
        <h1 className="lp-hero-title">
          Every tool you ship with. <span className="lp-accent">One quiet</span>{" "}
          <span className="lp-soft">hangar.</span>
        </h1>
        <p className="lp-hero-sub">
          Stop hopping between thirty dashboards. Hangar pins the tools you actually use, jumps you
          straight into your accounts, and watches your whole stack from one runway.
        </p>
        <div className="lp-hero-cta">
          <a className="lp-btn lp-btn-primary lp-btn-lg" href="/app">
            Open my hangar →
          </a>
          <a className="lp-btn lp-btn-lg" href="#features">
            See how it works
          </a>
        </div>
        <div className="lp-cta-note">
          <span>Free forever for solo devs.</span>
          <span className="lp-sep" />
          <span>No credit card.</span>
          <span className="lp-sep" />
          <span>30+ tools indexed.</span>
        </div>

        <div className="lp-hero-strip">
          <div className="lp-hero-strip-label">Your stack today</div>
          <div className="lp-hero-strip-tools">
            {HERO_IDS.map((id) => {
              const t = findTool(id);
              if (!t) return null;
              return (
                <div key={id} className="lp-hero-tool">
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
      </div>
    </header>
  );
}
