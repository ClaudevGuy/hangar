import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HangarApp } from "./components/HangarApp";
import "./styles.css";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Missing #root");

createRoot(rootEl).render(
  <StrictMode>
    <HangarApp />
  </StrictMode>,
);
