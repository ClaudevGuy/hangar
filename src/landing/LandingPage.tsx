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
import { Install } from "./sections/Install";
import { Pricing } from "./sections/Pricing";
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
      <Install />
      <Pricing />
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
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
        </div>
      </div>
      <div className="lp-nav-right">
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        <a className="lp-btn lp-btn-ghost" href="/app">
          Sign in
        </a>
        <a className="lp-btn lp-btn-primary" href="/app">
          Open hangar →
        </a>
      </div>
    </nav>
  );
}
