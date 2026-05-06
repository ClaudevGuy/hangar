import { findTool } from "../LandingPage";

const PIN_IDS = ["vercel", "neon", "github", "clerk", "resend", "stripe", "sentry", "figma"];
const PINNED = new Set(["vercel", "neon", "clerk", "stripe"]);
const LAUNCH_IDS = ["github", "vercel", "neon", "stripe"];

export function HowItWorks() {
  return (
    <section id="how" className="lp-workflow">
      <div className="lp-wrap">
        <div className="lp-sec-head">
          <div className="lp-sec-eyebrow">How it works</div>
          <h2 className="lp-sec-title">
            Three steps. <span className="lp-soft">No backend, no telemetry, no account.</span>
          </h2>
          <p className="lp-sec-sub">
            Hangar runs entirely in your browser. Your stack and your keys live in{" "}
            <code className="lp-code">localStorage</code> only — nothing is ever sent to a server
            (unless you opt into encrypted gist sync).
          </p>
        </div>
        <div className="lp-steps">
          <div className="lp-step">
            <div className="lp-step-head">
              <div className="lp-step-num">01</div>
              <span className="lp-step-tag">Pin</span>
            </div>
            <h3 className="lp-step-title">Pin your tools.</h3>
            <p className="lp-step-desc">
              Browse 29 built-ins across 11 categories — or click <strong>+ Add tool</strong> for
              your own with a name, URL and brand color. Search, filter, compare up to 3.
            </p>
            <div className="lp-step-visual">
              <div className="lp-mock lp-mock-pin">
                <div className="lp-mock-search">
                  <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="11" cy="11" r="7" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                  <span>Search tools…</span>
                </div>
                <div className="lp-mock-grid">
                  {PIN_IDS.map((id) => {
                    const t = findTool(id);
                    if (!t) return null;
                    return (
                      <div
                        key={id}
                        className={`lp-mock-tile ${PINNED.has(id) ? "lp-pinned" : ""}`}
                        style={{ color: t.color }}
                        dangerouslySetInnerHTML={{ __html: t.logo }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="lp-step">
            <div className="lp-step-head">
              <div className="lp-step-num">02</div>
              <span className="lp-step-tag">Vault</span>
            </div>
            <h3 className="lp-step-title">Vault your keys.</h3>
            <p className="lp-step-desc">
              Store API tokens per tool, multiple keys each, with labels. Reveal, copy, delete
              inline. Set a master passphrase for AES-GCM encryption at rest.
            </p>
            <div className="lp-step-visual">
              <div className="lp-mock lp-mock-vault">
                <div className="lp-mock-vault-head">
                  <span>Keys</span>
                  <span className="lp-mock-vault-count">7</span>
                </div>
                {[
                  { id: "github", label: "Personal Access Token", secret: "ghp_••••••••••••a3f2" },
                  { id: "openai", label: "Production", secret: "sk-proj-••••••••f7c1" },
                  { id: "stripe", label: "Live secret", secret: "sk_live_••••••••92e8" },
                ].map((row) => {
                  const t = findTool(row.id);
                  if (!t) return null;
                  return (
                    <div key={row.id} className="lp-mock-vault-row">
                      <span
                        className="lp-tool-logo lp-mock-vault-logo"
                        style={{ background: t.bg, color: t.color }}
                        dangerouslySetInnerHTML={{ __html: t.logo }}
                      />
                      <span className="lp-mock-vault-name">
                        {t.name}
                        <small>{row.label}</small>
                      </span>
                      <span className="lp-mock-vault-secret">{row.secret}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lp-step">
            <div className="lp-step-head">
              <div className="lp-step-num">03</div>
              <span className="lp-step-tag">Launch</span>
            </div>
            <h3 className="lp-step-title">Launch with one click.</h3>
            <p className="lp-step-desc">
              The quick-launch rail opens any pinned tool's dashboard in a new tab. Add a GitHub
              PAT and the drawer goes live with your profile and recent repos straight from the API.
            </p>
            <div className="lp-step-visual">
              <div className="lp-mock lp-mock-launch">
                {LAUNCH_IDS.map((id) => {
                  const t = findTool(id);
                  if (!t) return null;
                  return (
                    <div key={id} className="lp-mock-launch-row">
                      <span
                        className="lp-tool-logo lp-mock-launch-logo"
                        style={{ background: t.bg, color: t.color }}
                        dangerouslySetInnerHTML={{ __html: t.logo }}
                      />
                      <span className="lp-mock-launch-name">
                        {t.name}
                        <br />
                        <small>{t.accountUrl.replace("https://", "").split("/")[0]}</small>
                      </span>
                      <span className="lp-mock-launch-arrow">↗</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
