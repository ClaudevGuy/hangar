export function Install() {
  return (
    <section id="install">
      <div className="lp-wrap">
        <div className="lp-sec-head">
          <div className="lp-sec-eyebrow">Quick start</div>
          <h2 className="lp-sec-title">
            Three commands. <span className="lp-soft">Node 18 or newer.</span>
          </h2>
          <p className="lp-sec-sub">
            Hangar is a static Vite + React + TypeScript app. Clone, install, run. Build to a
            folder and host it on any CDN — GitHub Pages, Vercel, Netlify, your own VM. No
            server-side runtime needed.
          </p>
        </div>
        <div className="lp-install-grid">
          <div className="lp-terminal">
            <div className="lp-terminal-bar">
              <span style={{ background: "#ef4444" }} />
              <span style={{ background: "#f59e0b" }} />
              <span style={{ background: "var(--accent)" }} />
              <span className="lp-terminal-name">Terminal — bash</span>
            </div>
            <pre className="lp-terminal-pre">
              <span className="lp-terminal-comment"># clone the repo</span>
              {"\n"}
              <span className="lp-terminal-prompt">$</span> git clone https://github.com/ClaudevGuy/hangar.git
              {"\n"}
              <span className="lp-terminal-prompt">$</span> cd hangar
              {"\n\n"}
              <span className="lp-terminal-comment"># install &amp; run</span>
              {"\n"}
              <span className="lp-terminal-prompt">$</span> npm install
              {"\n"}
              <span className="lp-terminal-prompt">$</span> npm run dev
              {"\n\n"}
              <span className="lp-terminal-comment"># then open the tool in your browser</span>
              {"\n"}
              <span className="lp-accent">→</span> http://localhost:5173<span className="lp-accent">/app</span>
              {"\n\n"}
              <span className="lp-terminal-comment"># or build for production</span>
              {"\n"}
              <span className="lp-terminal-prompt">$</span> npm run build
              {"\n"}
              <span className="lp-terminal-prompt">$</span> npm run preview
            </pre>
          </div>
          <div className="lp-install-side">
            <div className="lp-install-card">
              <div className="lp-install-card-eyebrow">Stack</div>
              <div className="lp-install-card-body">
                Vite 5 · React 18 · TypeScript (strict) · Geist + Bricolage Grotesque · single
                hand-written <code className="lp-code">styles.css</code> with CSS custom properties
                for theming. No state library. No CSS framework.
              </div>
            </div>
            <div className="lp-install-card">
              <div className="lp-install-card-eyebrow">localStorage keys</div>
              <ul className="lp-storage-list">
                <li><span>hangar-stack</span><span>pinned tool ids</span></li>
                <li><span>hangar-prefs</span><span>theme · accent · density</span></li>
                <li><span>hangar-keys</span><span>API tokens, per tool</span></li>
                <li><span>hangar-custom-tools</span><span>tools you added yourself</span></li>
                <li><span>hangar-linkboard</span><span>cross-tool pinned items</span></li>
              </ul>
            </div>
            <div className="lp-install-tip">
              <strong>Reset to fresh state:</strong> open DevTools console and run{" "}
              <code className="lp-code">localStorage.clear(); location.reload();</code>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
