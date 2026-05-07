import { useEffect, useState } from "react";
import { TOOLS } from "../data/tools";
import type { Tool } from "../types";
import { ScrollToTop } from "./parts/ScrollToTop";
import { ThemeToggle } from "./parts/ThemeToggle";
import { Hero } from "./sections/Hero";
import { Problem } from "./sections/Problem";
import { Features } from "./sections/Features";
import { Catalog } from "./sections/Catalog";
import { HowItWorks } from "./sections/HowItWorks";
import { Showcase } from "./sections/Showcase";
import { Install } from "./sections/Install";
import { FAQ } from "./sections/FAQ";
import { FinalCTA } from "./sections/FinalCTA";
import { Footer } from "./sections/Footer";

// Resolve tool helpers shared across sections.
export function findTool(id: string): Tool | undefined {
  return TOOLS.find((t) => t.id === id);
}

export function LandingPage() {
  // Landing has its own theme persistence so the marketing site can be
  // independently styled from the app preference.
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";
    return (localStorage.getItem("hangar-landing-theme") as "dark" | "light") ?? "dark";
  });

  useEffect(() => {
    document.body.dataset.theme = theme;
    localStorage.setItem("hangar-landing-theme", theme);
    return () => {
      // When unmounting (navigating to /app), let the app's prefs hook take
      // over again — clear our forced theme.
      document.body.dataset.theme = "dark";
    };
  }, [theme]);

  return (
    <div className="landing">
      <Nav onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))} theme={theme} />
      <Hero />
      <Problem />
      <Features />
      <Catalog />
      <HowItWorks />
      <Showcase />
      <Install />
      <FAQ />
      <FinalCTA />
      <Footer />
      <ScrollToTop />
    </div>
  );
}

interface NavProps {
  theme: "dark" | "light";
  onToggleTheme: () => void;
}

function Nav({ theme, onToggleTheme }: NavProps) {
  return (
    <nav className="lp-nav">
      <div className="lp-nav-left">
        <a className="lp-brand" href="#top">
          <svg viewBox="0 0 32 32" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M4 24 16 6l12 18M4 24h24M9 24v-6h14v6" />
          </svg>
          <span>Hangar</span>
          <span className="lp-brand-tag">control tower</span>
        </a>
        <div className="lp-nav-links">
          <a href="#install">Install</a>
          <a href="#features">Features</a>
          <a href="#catalog">Catalog</a>
          <a href="#how">How it works</a>
          <a href="#showcase">Demo Video</a>
          <a href="#faq">FAQ</a>
        </div>
      </div>
      <div className="lp-nav-right">
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        <a
          className="lp-btn lp-btn-ghost lp-nav-gh"
          href="https://github.com/ClaudevGuy/hangar"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Star Hangar on GitHub"
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden>
            <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-1.93c-3.2.7-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.74.4-1.26.73-1.55-2.55-.29-5.23-1.27-5.23-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.17a10.95 10.95 0 0 1 5.74 0c2.18-1.48 3.14-1.17 3.14-1.17.62 1.58.23 2.75.11 3.04.74.8 1.18 1.82 1.18 3.07 0 4.4-2.69 5.36-5.25 5.65.41.36.78 1.06.78 2.13v3.16c0 .31.21.67.79.55C20.71 21.39 24 17.08 24 12 24 5.65 18.85.5 12 .5z" />
          </svg>
          <span className="lp-nav-gh-label">Star on GitHub</span>
        </a>
        <a className="lp-btn lp-btn-primary" href="#install">
          Get started →
        </a>
      </div>
    </nav>
  );
}
