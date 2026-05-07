import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { HangarApp } from "./components/HangarApp";
import { LandingPage } from "./landing/LandingPage";
import { PrivacyPage } from "./landing/parts/PrivacyPage";
import { RunLocalPrompt } from "./landing/parts/RunLocalPrompt";
import { SharePreview } from "./landing/parts/SharePreview";
import { TermsPage } from "./landing/parts/TermsPage";
import "./styles.css";
import "./landing/landing.css";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Missing #root");

function isLocalHost(): boolean {
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0";
}

// On localhost the marketing landing is friction — someone running
// `npm run dev` already followed the install flow on the marketing
// site to get here. Skip the landing and go straight to /app. Any
// deployed host keeps serving the landing as the front door.
// Escape hatch: `?landing` on localhost still renders the marketing
// page (handy for design work).
function RootRoute() {
  const wantsLanding = new URLSearchParams(window.location.search).has("landing");
  if (isLocalHost() && !wantsLanding) return <Navigate to="/app" replace />;
  return <LandingPage />;
}

// /app is for the local install only. On the deployed origin we'd just be
// creating a separate localStorage silo per visitor with no path back to
// their real stack — show an install prompt instead.
function AppRoute() {
  if (!isLocalHost()) return <RunLocalPrompt />;
  return <HangarApp />;
}

createRoot(rootEl).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRoute />} />
        <Route path="/app/*" element={<AppRoute />} />
        <Route path="/share" element={<SharePreview />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
