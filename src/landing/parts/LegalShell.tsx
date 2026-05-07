import { useEffect } from "react";
import type { ReactNode } from "react";

interface Props {
  title: string;
  eyebrow: string;
  lastUpdated: string;
  children: ReactNode;
}

// Shared chrome for the marketing site's legal pages (Privacy, Terms).
// Reads the user's saved landing theme so dark/light mode stays consistent
// when navigating between the marketing pages.
export function LegalShell({ title, eyebrow, lastUpdated, children }: Props) {
  useEffect(() => {
    const stored = (localStorage.getItem("hangar-landing-theme") as "dark" | "light") ?? "dark";
    const prev = document.body.dataset.theme;
    document.body.dataset.theme = stored;
    return () => {
      document.body.dataset.theme = prev || "dark";
    };
  }, []);

  return (
    <div className="legal-page">
      <nav className="legal-nav">
        <a className="lp-brand" href="/">
          <svg viewBox="0 0 32 32" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M4 24 16 6l12 18M4 24h24M9 24v-6h14v6" />
          </svg>
          <span>Hangar</span>
          <span className="lp-brand-tag">control tower</span>
        </a>
        <a className="lp-btn lp-btn-ghost" href="/">← Back to Hangar</a>
      </nav>

      <article className="legal-article">
        <header className="legal-header">
          <div className="legal-eyebrow">{eyebrow}</div>
          <h1 className="legal-title">{title}</h1>
          <div className="legal-meta">Last updated · {lastUpdated}</div>
        </header>
        <div className="legal-body">{children}</div>
        <footer className="legal-foot">
          <a className="lp-btn lp-btn-primary" href="/">Back to Hangar</a>
        </footer>
      </article>
    </div>
  );
}
