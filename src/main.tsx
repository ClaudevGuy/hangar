import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { HangarApp } from "./components/HangarApp";
import { LandingPage } from "./landing/LandingPage";
import "./styles.css";
import "./landing/landing.css";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Missing #root");

// On localhost the marketing landing is friction — someone running
// `npm run dev` already followed the install flow on the marketing
// site to get here. Skip the landing and go straight to /app. Any
// deployed host keeps serving the landing as the front door.
// Escape hatch: `?landing` on localhost still renders the marketing
// page (handy for design work).
function RootRoute() {
  const host = window.location.hostname;
  const isLocal = host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0";
  const wantsLanding = new URLSearchParams(window.location.search).has("landing");
  if (isLocal && !wantsLanding) return <Navigate to="/app" replace />;
  return <LandingPage />;
}

createRoot(rootEl).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRoute />} />
        <Route path="/app/*" element={<HangarApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
