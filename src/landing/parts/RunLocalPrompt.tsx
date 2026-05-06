import { useEffect } from "react";

// Rendered at /app on the deployed origin (anything that isn't localhost).
// Hangar's whole privacy story is "your stack lives in your browser only" —
// running the app off the public URL just creates a stranded silo separate
// from the user's local install, so we send curious visitors to the install
// instructions instead.
export function RunLocalPrompt() {
  useEffect(() => {
    const stored = (localStorage.getItem("hangar-landing-theme") as "dark" | "light") ?? "dark";
    const prev = document.body.dataset.theme;
    document.body.dataset.theme = stored;
    return () => {
      document.body.dataset.theme = prev || "dark";
    };
  }, []);

  return (
    <div className="run-local">
      <div className="run-local-bg" />
      <div className="run-local-glow" />
      <div className="run-local-inner">
        <div className="run-local-eyebrow">Local-first by design</div>
        <h1 className="run-local-title">
          Hangar runs <span className="lp-accent">on your machine</span>,<br />
          <span className="lp-soft">not on ours.</span>
        </h1>
        <p className="run-local-desc">
          Your stack, your tokens, your activity — all live in your browser&apos;s
          localStorage on the machine you install on. There&apos;s no Hangar account,
          no server-side database, nothing for us to lose. Install locally to start.
        </p>
        <div className="run-local-cta">
          <a className="lp-btn lp-btn-primary lp-btn-lg" href="/#install">
            See install steps →
          </a>
          <a className="lp-btn lp-btn-lg" href="/#showcase">
            Watch the 40s showcase first
          </a>
        </div>
        <div className="run-local-foot">
          <code className="lp-code">git clone</code>
          <code className="lp-code">npm install</code>
          <code className="lp-code">npm run dev</code>
        </div>
      </div>
    </div>
  );
}
