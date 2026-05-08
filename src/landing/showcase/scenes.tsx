// Hangar showcase video v2 — refreshed for the current product.
// 52s, 16:9 (1920x1080). Scenes:
//   0–4    Cold open: chaotic browser tabs
//   4–8    Wordmark
//   8–15   Catalog: pin + add your own tool
//   15–21  Compare side-by-side
//   21–27  Vault — local-only, encrypted
//   27–36  Live integrations carousel (GitHub · Vercel · Linear · Sentry)
//   36–44  MCP — AI agents read your stack
//   44–48  Settings (accents · density · card style)
//   48–52  End card

import { Fragment } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Easing, Sprite, clamp, useSprite } from "./animations";

// ─── design tokens ──────────────────────────────────────────────
const HV2 = {
  bg: "#07080a",
  bg2: "#0e1013",
  panel: "#11141a",
  line: "#1d2128",
  lineSoft: "#14171c",
  text: "#f6f4ef",
  text2: "#a8a39a",
  text3: "#5e5a52",
  accent: "#9eff64",
  accentDim: "rgba(158,255,100,0.16)",
  accentRing: "rgba(158,255,100,0.35)",
  fontDisplay: '"Bricolage Grotesque", system-ui, sans-serif',
  fontSans: '"Geist", system-ui, sans-serif',
  fontMono: '"Geist Mono", ui-monospace, monospace',
};

interface ToolDef {
  id: string;
  name: string;
  cat: string;
  color: string;
  bg: string;
  logo: string;
}

const TOOLS: ToolDef[] = [
  { id: "vercel", name: "Vercel", cat: "Hosting", color: "#fff", bg: "#000", logo: '<svg viewBox="0 0 76 65" fill="currentColor"><path d="M37.59.25l36.95 64H.64l36.95-64z"/></svg>' },
  { id: "github", name: "GitHub", cat: "Source", color: "#fff", bg: "#0d1117", logo: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .3a12 12 0 00-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.3-3.1-.2-.4-.6-1.6 0-3.2 0 0 1-.3 3.4 1.2a11.5 11.5 0 016 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.6.2 2.8.1 3.2.7.8 1.3 1.9 1.3 3.1 0 4.6-2.8 5.6-5.5 5.9.5.4.9 1.2.9 2.4v3.5c0 .3.1.7.8.6A12 12 0 0012 .3z"/></svg>' },
  { id: "neon", name: "Neon", cat: "Database", color: "#00E599", bg: "#001A0D", logo: '<svg viewBox="0 0 100 100" fill="currentColor"><path d="M10 25c0-8 7-15 15-15h50c8 0 15 7 15 15v40L60 30v40H25c-8 0-15-7-15-15V25z"/></svg>' },
  { id: "clerk", name: "Clerk", cat: "Auth", color: "#6C47FF", bg: "#0F0A24", logo: '<svg viewBox="0 0 100 100" fill="currentColor"><circle cx="50" cy="50" r="40"/></svg>' },
  { id: "stripe", name: "Stripe", cat: "Payments", color: "#635BFF", bg: "#0E0D26", logo: '<svg viewBox="0 0 100 100" fill="currentColor"><path d="M30 30h40v15H50v10c0 5 5 10 15 10v15c-25 0-30-15-30-25V30z"/></svg>' },
  { id: "resend", name: "Resend", cat: "Email", color: "#fff", bg: "#000", logo: '<svg viewBox="0 0 100 100" fill="currentColor"><path d="M20 25h45c10 0 18 8 18 18s-8 18-18 18H40v15h-20V25zm20 18v15h22c4 0 7-3 7-7s-3-8-7-8H40z"/></svg>' },
  { id: "sentry", name: "Sentry", cat: "Monitoring", color: "#362d59", bg: "#fff", logo: '<svg viewBox="0 0 100 100" fill="currentColor"><path d="M50 15l35 60H70c-2-12-12-22-25-22v-15c20 0 35 16 38 37H30L50 40l5 8c8 2 14 9 16 17h6L50 30 25 75H15z"/></svg>' },
  { id: "figma", name: "Figma", cat: "Design", color: "#f24e1e", bg: "#0f0f0f", logo: '<svg viewBox="0 0 100 100" fill="currentColor"><circle cx="65" cy="50" r="15"/><path d="M35 5h30v30H35a15 15 0 010-30zm0 30h30v30H35a15 15 0 010-30zm0 30h30v30a15 15 0 01-30 0V65z"/></svg>' },
  { id: "linear", name: "Linear", cat: "PM", color: "#5e6ad2", bg: "#0a0a14", logo: '<svg viewBox="0 0 100 100" fill="currentColor"><path d="M5 60c0-25 20-45 45-45s45 20 45 45H80c0-17-13-30-30-30s-30 13-30 30H5zm20 5c0-14 11-25 25-25s25 11 25 25H60c0-6-5-10-10-10s-10 4-10 10H25z"/></svg>' },
  { id: "anthropic", name: "Anthropic", cat: "AI", color: "#cc785c", bg: "#1a1410", logo: '<svg viewBox="0 0 100 100" fill="currentColor"><path d="M30 80L50 20l20 60h-12l-3-10H45l-3 10H30zm17-22h6l-3-12-3 12z"/></svg>' },
];

const TAB_TITLES = [
  "Vercel — Project", "GitHub — pulls/3", "Neon — Dashboard", "Clerk — Users", "Stripe — Payments",
  "Resend — Inbox", "Sentry — Issues 4", "Figma — Drafts", "Linear — HAN-12", "Anthropic Console",
  "PostHog", "Inngest", "Discord", "Notion", "Slack", "Tailscale", "Plausible", "Dub.co", "Loops", "Cron",
  "Highlight", "Fly — Logs", "Supabase", "Convex", "OpenAI", "Polar", "Liveblocks", "Algolia", "Trigger.dev",
  "Cloudflare", "Railway", "Render", "PlanetScale", "Upstash", "Pulumi", "Auth0", "WorkOS", "Statsig",
  "Vercel Analytics", "Logflare", "Better Stack", "Cron-job", "Datadog", "Knock", "Crisp", "Plain", "Lokalise",
];

interface ToolTileProps {
  tool: ToolDef;
  size?: number;
  radius?: number;
  opacity?: number;
  scale?: number;
}

function ToolTile({ tool, size = 56, radius = 10, opacity = 1, scale = 1 }: ToolTileProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        background: tool.bg,
        color: tool.color,
        borderRadius: radius,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${scale})`,
        transformOrigin: "center",
        opacity,
        boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
        flexShrink: 0,
      }}
    >
      <div
        style={{ width: size * 0.5, height: size * 0.5 }}
        dangerouslySetInnerHTML={{ __html: tool.logo }}
      />
    </div>
  );
}

interface SceneShellProps {
  children?: ReactNode;
  label?: string;
  title?: ReactNode;
  accent?: string;
  opacity?: number;
}

function SceneShell({ children, label, title, accent = HV2.accent, opacity = 1 }: SceneShellProps) {
  return (
    <div style={{ position: "absolute", inset: 0, background: HV2.bg, opacity }}>
      {label && (
        <div
          style={{
            position: "absolute", left: 60, top: 60,
            fontFamily: HV2.fontMono, fontSize: 13, color: accent,
            letterSpacing: "0.2em", textTransform: "uppercase",
          }}
        >
          {label}
        </div>
      )}
      {title && (
        <div
          style={{
            position: "absolute", left: 60, top: 92,
            fontFamily: HV2.fontDisplay, fontSize: 56, fontWeight: 600,
            letterSpacing: "-0.025em", color: HV2.text, lineHeight: 1.05, maxWidth: 1100,
          }}
        >
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SCENE 1 — chaos (0-4s)
function ChaosScene() {
  const { localTime } = useSprite();
  const tabsShown = Math.min(TAB_TITLES.length, Math.floor(localTime * 16));
  const counterTabs = Math.floor(localTime * 19);
  const shakeT = Math.max(0, localTime - 2.6) / 1.4;
  const shakeAmp = shakeT * 8;
  const shakeX = Math.sin(localTime * 80) * shakeAmp;
  const shakeY = Math.cos(localTime * 70) * shakeAmp;
  const flash = localTime > 3.4 ? Math.max(0, 1 - (localTime - 3.4) / 0.4) : 0;

  return (
    <div
      style={{
        position: "absolute", inset: 0, background: HV2.bg,
        transform: `translate(${shakeX}px, ${shakeY}px)`, overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 88,
          background: "#15171b", borderBottom: `1px solid ${HV2.line}`,
          display: "flex", flexWrap: "wrap", alignItems: "flex-start",
          padding: "12px 24px 0", gap: 2,
        }}
      >
        {TAB_TITLES.slice(0, tabsShown).map((t, i) => (
          <div
            key={i}
            style={{
              height: 30, minWidth: 24, maxWidth: 140, padding: "0 10px",
              background: i === tabsShown - 1 ? "#262a31" : "#1d2026",
              borderRadius: "6px 6px 0 0", color: HV2.text2,
              fontFamily: HV2.fontSans, fontSize: 11,
              display: "flex", alignItems: "center", gap: 6,
              overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", flexShrink: 1,
            }}
          >
            <span
              style={{
                width: 10, height: 10, borderRadius: "50%",
                background:
                  i % 4 === 0 ? "#9eff64" :
                  i % 4 === 1 ? "#3b82f6" :
                  i % 4 === 2 ? "#f59e0b" : "#ef4444",
                flexShrink: 0,
              }}
            />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{t}</span>
          </div>
        ))}
      </div>

      <div
        style={{
          position: "absolute", left: "50%", top: "52%",
          transform: "translate(-50%,-50%)", textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: HV2.fontMono, fontSize: 18, color: "#ef4444",
            letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 24,
            opacity: localTime > 1.2 ? 1 : 0, transition: "opacity .3s",
          }}
        >
          OPEN TABS
        </div>
        <div
          style={{
            fontFamily: HV2.fontDisplay, fontSize: 320, fontWeight: 700,
            color: HV2.text, letterSpacing: "-0.06em", lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
            textShadow: shakeT > 0 ? `0 0 ${shakeT * 30}px rgba(239,68,68,0.6)` : "none",
          }}
        >
          {String(Math.min(counterTabs, 47)).padStart(2, "0")}
        </div>
        <div
          style={{
            fontFamily: HV2.fontSans, fontSize: 22, color: HV2.text3, marginTop: 24,
            opacity: localTime > 2 ? 1 : 0, transition: "opacity .4s",
          }}
        >
          across 12 tools · 4 dashboards · 3 hours of context-switching
        </div>
      </div>

      <div style={{ position: "absolute", inset: 0, background: `rgba(239,68,68,${flash * 0.18})` }} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SCENE 2 — wordmark (4-8s)
function WordmarkScene() {
  const { localTime } = useSprite();
  const flash = Math.max(0, 1 - localTime / 0.4);
  const wmT = Easing.easeOutBack(clamp((localTime - 0.3) / 0.9, 0, 1));
  const wmExit = localTime > 3.4 ? Easing.easeInCubic((localTime - 3.4) / 0.6) : 0;
  const wmScale = 0.7 + wmT * 0.3 + wmExit * 0.05;
  const wmOpacity = clamp(wmT - wmExit, 0, 1);
  const tagOp = clamp((localTime - 1.4) / 0.5 - wmExit, 0, 1);
  const ulP = Easing.easeOutQuart(clamp((localTime - 1.0) / 1.6, 0, 1));

  const radialMask: CSSProperties = {
    maskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)",
    WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)",
  };

  return (
    <div
      style={{
        position: "absolute", inset: 0, background: HV2.bg,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "absolute", inset: 0,
          backgroundImage: `linear-gradient(${HV2.line} 1px, transparent 1px), linear-gradient(90deg, ${HV2.line} 1px, transparent 1px)`,
          backgroundSize: "64px 64px", opacity: 0.4,
          ...radialMask,
        }}
      />
      <div
        style={{
          position: "absolute", width: 800, height: 800, borderRadius: "50%",
          background: `radial-gradient(circle, ${HV2.accent} 0%, transparent 60%)`,
          opacity: 0.12 * wmOpacity, filter: "blur(80px)",
        }}
      />
      <div
        style={{
          fontFamily: HV2.fontDisplay, fontSize: 280, fontWeight: 700,
          letterSpacing: "-0.05em", color: HV2.text,
          transform: `scale(${wmScale})`, opacity: wmOpacity, position: "relative",
        }}
      >
        Hangar<span style={{ color: HV2.accent }}>.</span>
      </div>
      <svg width="540" height="14" style={{ marginTop: -28, opacity: wmOpacity }}>
        <line x1="0" y1="6" x2={540 * ulP} y2="6" stroke={HV2.accent} strokeWidth="3" strokeLinecap="round" />
      </svg>
      <div
        style={{
          fontFamily: HV2.fontSans, fontSize: 26, color: HV2.text2, marginTop: 32,
          opacity: tagOp, letterSpacing: "0.02em",
        }}
      >
        Pin your stack. <span style={{ color: HV2.text }}>Vault your tokens.</span>{" "}
        <span style={{ color: HV2.text3 }}>One screen.</span>
      </div>
      <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: flash }} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SCENE 3 — catalog + add custom tool (8-15s, 7s)
function CatalogScene() {
  const { localTime } = useSprite();
  const chromeT = Easing.easeOutCubic(clamp(localTime / 0.5, 0, 1));

  const pinIds = ["vercel", "github", "neon", "clerk", "stripe", "resend"];
  const pinStart = (i: number) => 0.6 + i * 0.18;

  const modalT = Easing.easeOutCubic(clamp((localTime - 3.4) / 0.5, 0, 1));
  const modalExit = clamp((localTime - 5.6) / 0.4, 0, 1);
  const modalOp = clamp(modalT - modalExit, 0, 1);
  const nameFull = "Inngest";
  const nameT = clamp((localTime - 3.9) / 0.7, 0, 1);
  const nameShown = nameFull.slice(0, Math.floor(nameT * nameFull.length + 0.001));
  const urlFull = "inngest.com/dash";
  const urlT = clamp((localTime - 4.5) / 0.7, 0, 1);
  const urlShown = urlFull.slice(0, Math.floor(urlT * urlFull.length + 0.001));
  const colorPicked = localTime > 5.0;
  const saved = localTime > 5.6;
  const newToolGlow = clamp((localTime - 5.7) / 0.5, 0, 1);

  return (
    <div style={{ position: "absolute", inset: 0, background: HV2.bg, padding: 40, opacity: chromeT }}>
      <div
        style={{
          background: HV2.panel, border: `1px solid ${HV2.line}`,
          borderRadius: 16, height: "100%", overflow: "hidden",
          display: "flex", flexDirection: "column",
        }}
      >
        <div
          style={{
            height: 56, borderBottom: `1px solid ${HV2.line}`,
            display: "flex", alignItems: "center", padding: "0 24px", gap: 14,
          }}
        >
          <div style={{ fontFamily: HV2.fontDisplay, fontWeight: 700, fontSize: 18, color: HV2.text }}>
            Hangar<span style={{ color: HV2.accent }}>.</span>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ fontFamily: HV2.fontMono, fontSize: 11, color: HV2.text3, letterSpacing: "0.15em" }}>
            29 TOOLS · 11 CATEGORIES
          </div>
        </div>

        <div
          style={{
            padding: "14px 24px", borderBottom: `1px solid ${HV2.line}`,
            display: "flex", gap: 8, overflow: "hidden",
          }}
        >
          {["All", "Hosting", "Database", "Auth", "Payments", "Email", "Monitoring", "AI", "Design", "PM", "Source"].map(
            (c, i) => (
              <div
                key={c}
                style={{
                  padding: "6px 12px", borderRadius: 999,
                  border: `1px solid ${i === 0 ? HV2.accent : HV2.line}`,
                  background: i === 0 ? HV2.accentDim : "transparent",
                  color: i === 0 ? HV2.accent : HV2.text2,
                  fontFamily: HV2.fontMono, fontSize: 11, fontWeight: 500,
                  whiteSpace: "nowrap",
                }}
              >
                {c}
              </div>
            ),
          )}
        </div>

        <div style={{ flex: 1, padding: 32, position: "relative", minHeight: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div
              style={{
                fontFamily: HV2.fontMono, fontSize: 11, color: HV2.text3,
                textTransform: "uppercase", letterSpacing: "0.16em",
              }}
            >
              Catalog
            </div>
            <div
              style={{
                padding: "6px 12px",
                border: `1px solid ${localTime > 3.0 && localTime < 3.6 ? HV2.accent : HV2.line}`,
                background: localTime > 3.0 && localTime < 3.6 ? HV2.accentDim : "transparent",
                borderRadius: 8, color: HV2.text,
                fontFamily: HV2.fontSans, fontSize: 12, fontWeight: 500,
              }}
            >
              + Add tool
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14 }}>
            {TOOLS.map((t, i) => {
              const tStart = 0.4 + i * 0.07;
              const tProg = Easing.easeOutBack(clamp((localTime - tStart) / 0.5, 0, 1));
              const isPinned = pinIds.includes(t.id);
              const pT = isPinned
                ? Easing.easeInOutCubic(clamp((localTime - pinStart(pinIds.indexOf(t.id))) / 0.6, 0, 1))
                : 0;
              return (
                <div
                  key={t.id}
                  style={{
                    border: `1px solid ${pT > 0.1 ? HV2.accent : HV2.line}`,
                    borderRadius: 10, padding: 14,
                    background: pT > 0.1 ? HV2.accentDim : HV2.bg2,
                    display: "flex", flexDirection: "column", gap: 8,
                    opacity: tProg,
                    transform: `translateY(${(1 - tProg) * 24}px) scale(${tProg})`,
                    position: "relative",
                  }}
                >
                  {pT > 0.5 && (
                    <div
                      style={{
                        position: "absolute", top: 8, right: 8,
                        width: 8, height: 8, borderRadius: "50%", background: HV2.accent,
                        boxShadow: `0 0 8px ${HV2.accent}`,
                      }}
                    />
                  )}
                  <ToolTile tool={t} size={32} radius={6} />
                  <div style={{ fontFamily: HV2.fontSans, fontSize: 13, fontWeight: 600, color: HV2.text }}>
                    {t.name}
                  </div>
                  <div
                    style={{
                      fontFamily: HV2.fontMono, fontSize: 9, color: HV2.text3,
                      textTransform: "uppercase", letterSpacing: "0.14em",
                    }}
                  >
                    {t.cat}
                  </div>
                </div>
              );
            })}

            {saved && (
              <div
                style={{
                  border: `1px solid ${HV2.accent}`,
                  borderRadius: 10, padding: 14,
                  background: HV2.accentDim,
                  display: "flex", flexDirection: "column", gap: 8,
                  opacity: newToolGlow,
                  transform: `scale(${0.9 + 0.1 * newToolGlow})`,
                  boxShadow: `0 0 24px ${HV2.accentRing}`,
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: 32, height: 32, borderRadius: 6,
                    background: "#ff8a4c", color: "#1a1410",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: HV2.fontDisplay, fontWeight: 700, fontSize: 14,
                  }}
                >
                  IN
                </div>
                <div style={{ fontFamily: HV2.fontSans, fontSize: 13, fontWeight: 600, color: HV2.text }}>
                  Inngest
                </div>
                <div
                  style={{
                    fontFamily: HV2.fontMono, fontSize: 9, color: "#ff8a4c",
                    textTransform: "uppercase", letterSpacing: "0.14em",
                  }}
                >
                  CUSTOM · QUEUE
                </div>
              </div>
            )}
          </div>

          <div
            style={{
              position: "absolute", bottom: 28, left: 32, right: 32,
              fontFamily: HV2.fontDisplay, fontSize: 36, fontWeight: 600,
              color: HV2.text, letterSpacing: "-0.02em", height: 50,
            }}
          >
            <div
              style={{
                position: "absolute", inset: 0,
                opacity: clamp((localTime - 0.6) / 0.5, 0, 1) - clamp((localTime - 3.0) / 0.4, 0, 1),
              }}
            >
              <span style={{ color: HV2.accent }}>01</span> &nbsp;Pin every tool you ship with.
            </div>
            <div style={{ position: "absolute", inset: 0, opacity: clamp((localTime - 3.4) / 0.4, 0, 1) }}>
              Not in the catalog? <span style={{ color: HV2.accent }}>Add your own.</span>
            </div>
          </div>

          {modalOp > 0 && (
            <div
              style={{
                position: "absolute", inset: 0,
                background: "rgba(7,8,10,0.7)",
                opacity: modalOp,
                display: "flex", alignItems: "center", justifyContent: "center",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
              }}
            >
              <div
                style={{
                  width: 460,
                  background: HV2.panel,
                  border: `1px solid ${HV2.line}`,
                  borderRadius: 14, padding: 24,
                  transform: `translateY(${(1 - modalOp) * 20}px)`,
                }}
              >
                <div style={{ fontFamily: HV2.fontDisplay, fontSize: 22, fontWeight: 600, color: HV2.text }}>
                  Add a tool
                </div>
                <div
                  style={{
                    fontFamily: HV2.fontSans, fontSize: 12, color: HV2.text3,
                    marginTop: 4, marginBottom: 18,
                  }}
                >
                  Saved to your custom catalog locally
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      fontFamily: HV2.fontMono, fontSize: 10, color: HV2.text3,
                      letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6,
                    }}
                  >
                    NAME
                  </div>
                  <div
                    style={{
                      background: HV2.bg2,
                      border: `1px solid ${nameT > 0 && nameT < 1 ? HV2.accent : HV2.line}`,
                      borderRadius: 8, padding: "10px 12px",
                      fontFamily: HV2.fontSans, fontSize: 14, color: HV2.text, height: 18,
                    }}
                  >
                    {nameShown}
                    {nameT > 0 && nameT < 1 ? <span style={{ color: HV2.accent }}>|</span> : null}
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      fontFamily: HV2.fontMono, fontSize: 10, color: HV2.text3,
                      letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6,
                    }}
                  >
                    DASHBOARD URL
                  </div>
                  <div
                    style={{
                      background: HV2.bg2,
                      border: `1px solid ${urlT > 0 && urlT < 1 ? HV2.accent : HV2.line}`,
                      borderRadius: 8, padding: "10px 12px",
                      fontFamily: HV2.fontMono, fontSize: 13, color: HV2.text2, height: 18,
                    }}
                  >
                    {urlShown}
                    {urlT > 0 && urlT < 1 ? <span style={{ color: HV2.accent }}>|</span> : null}
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      fontFamily: HV2.fontMono, fontSize: 10, color: HV2.text3,
                      letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6,
                    }}
                  >
                    BRAND COLOR
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {["#9eff64", "#ff8a4c", "#a78bfa", "#7dd3fc", "#fff"].map((c, i) => (
                      <div
                        key={c}
                        style={{
                          width: 28, height: 28, borderRadius: 6, background: c,
                          border: `2px solid ${colorPicked && i === 1 ? HV2.text : "transparent"}`,
                          boxShadow: colorPicked && i === 1 ? `0 0 0 2px ${HV2.accent}` : "none",
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    padding: "12px 16px",
                    background: localTime > 5.4 && localTime < 5.7 ? HV2.accent : HV2.bg2,
                    color: localTime > 5.4 && localTime < 5.7 ? HV2.bg : HV2.text,
                    border: `1px solid ${HV2.line}`,
                    borderRadius: 8, textAlign: "center",
                    fontFamily: HV2.fontSans, fontSize: 13, fontWeight: 600,
                  }}
                >
                  Add tool
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SCENE 4 — compare (15-21s, 6s)
type CompareRowKey = "cat" | "does" | "price";
interface CompareRow {
  label: string;
  key: CompareRowKey;
  highlight?: boolean;
}
interface CompareCol {
  tool: ToolDef;
  cat: string;
  does: string;
  price: string;
}

function CompareScene() {
  const { localTime } = useSprite();
  const chromeT = Easing.easeOutCubic(clamp(localTime / 0.5, 0, 1));

  const cols: CompareCol[] = [
    { tool: TOOLS[2]!, cat: "Database", does: "Serverless Postgres with branching", price: "$0 free · $19/mo Pro" },
    { tool: TOOLS[1]!, cat: "Source", does: "Git hosting + CI/CD + reviews", price: "$0 free · $4/user/mo" },
    { tool: TOOLS[4]!, cat: "Payments", does: "Card processing + subscriptions", price: "2.9% + 30¢" },
  ];
  const colT = (i: number) => Easing.easeOutCubic(clamp((localTime - 0.6 - i * 0.18) / 0.6, 0, 1));
  const highlightT = clamp((localTime - 3.6) / 0.5, 0, 1);

  const rows: CompareRow[] = [
    { label: "Category", key: "cat" },
    { label: "What it does", key: "does" },
    { label: "Pricing", key: "price", highlight: true },
  ];

  return (
    <SceneShell
      label="02 — Compare"
      title={
        <>
          Three tools.<br />
          <span style={{ color: HV2.text3 }}>One grid.</span>
        </>
      }
      opacity={chromeT}
    >
      <div
        style={{
          position: "absolute", left: 60, top: 280, right: 60, bottom: 80,
          background: HV2.panel, border: `1px solid ${HV2.line}`,
          borderRadius: 16, padding: 32,
          display: "grid", gridTemplateColumns: "180px 1fr 1fr 1fr",
          rowGap: 0, columnGap: 24,
        }}
      >
        <div></div>
        {cols.map((c, i) => (
          <div
            key={i}
            style={{
              paddingBottom: 18, borderBottom: `1px solid ${HV2.line}`,
              display: "flex", alignItems: "center", gap: 12,
              opacity: colT(i),
              transform: `translateY(${(1 - colT(i)) * 16}px)`,
            }}
          >
            <ToolTile tool={c.tool} size={48} radius={8} />
            <div style={{ fontFamily: HV2.fontDisplay, fontSize: 26, fontWeight: 600, color: HV2.text }}>
              {c.tool.name}
            </div>
          </div>
        ))}

        {rows.map((r) => (
          <Fragment key={r.label}>
            <div
              style={{
                borderBottom: `1px solid ${HV2.lineSoft}`, padding: "24px 0",
                fontFamily: HV2.fontMono, fontSize: 11, color: HV2.text3,
                letterSpacing: "0.16em", textTransform: "uppercase",
                alignSelf: "center",
              }}
            >
              {r.label}
            </div>
            {cols.map((c, i) => (
              <div
                key={i}
                style={{
                  borderBottom: `1px solid ${HV2.lineSoft}`, padding: "24px 0",
                  fontFamily: HV2.fontSans,
                  fontSize: r.key === "does" ? 16 : 18,
                  fontWeight: r.highlight ? 600 : 400,
                  color: r.highlight ? HV2.accent : HV2.text,
                  opacity: colT(i),
                  background:
                    r.highlight && highlightT > 0
                      ? `linear-gradient(90deg, transparent, ${HV2.accentDim} ${highlightT * 100}%)`
                      : "transparent",
                  paddingLeft: r.highlight ? 12 : 0,
                  borderRadius: r.highlight ? 8 : 0,
                  transition: "background .3s",
                }}
              >
                {c[r.key]}
              </div>
            ))}
          </Fragment>
        ))}
      </div>

      <div
        style={{
          position: "absolute", right: 60, top: 60,
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 16px",
          background: HV2.panel, border: `1px solid ${HV2.line}`,
          borderRadius: 999,
          opacity: clamp((localTime - 0.4) / 0.4, 0, 1),
        }}
      >
        <span style={{ fontFamily: HV2.fontMono, fontSize: 11, color: HV2.text3, letterSpacing: "0.14em" }}>
          SELECTED
        </span>
        {cols.map((c, i) => (
          <div key={i} style={{ opacity: colT(i) }}>
            <ToolTile tool={c.tool} size={26} radius={5} />
          </div>
        ))}
        <div
          style={{
            padding: "6px 12px", background: HV2.accent, color: HV2.bg,
            borderRadius: 999, fontFamily: HV2.fontSans, fontSize: 12, fontWeight: 600,
          }}
        >
          Compare ↗
        </div>
      </div>
    </SceneShell>
  );
}

// ════════════════════════════════════════════════════════════════
// SCENE 5 — vault (21-27s, 6s)
function VaultScene() {
  const { localTime } = useSprite();
  const chromeT = Easing.easeOutCubic(clamp(localTime / 0.5, 0, 1));

  const KEYS = [
    { tool: TOOLS[1]!, label: "Personal Access Token", secret: "ghp_a1b2c3d4e5f6g7h8i9j0" },
    { tool: TOOLS[2]!, label: "Production", secret: "pg_live_neon_84jH3kdL2mN8pQ4r" },
    { tool: TOOLS[0]!, label: "Read+deploy", secret: "vc_live_8Hk2pQ4nM7vT3xL9" },
    { tool: TOOLS[4]!, label: "Live secret", secret: "sk_live_stripe_91pQ8nM4r" },
    { tool: TOOLS[8]!, label: "API", secret: "lin_api_K4nM7vT3xL9pQ8j" },
    { tool: TOOLS[9]!, label: "Workspace API", secret: "sk-ant-api03-zX9pQ4r" },
  ];
  const rowStart = (i: number) => 0.5 + i * 0.16;
  const revealRow = 2;
  const revealT = clamp((localTime - 3.0) / 0.5, 0, 1);
  const copyT = clamp((localTime - 4.2) / 0.6, 0, 1);

  return (
    <SceneShell
      label="03 — Vault"
      title={
        <>
          Your keys.<br />
          <span style={{ color: HV2.accent }}>Local. Encrypted.</span>
        </>
      }
      opacity={chromeT}
    >
      <div
        style={{
          position: "absolute", left: 60, top: 290, right: 60, bottom: 80,
          display: "flex", gap: 32,
        }}
      >
        <div
          style={{
            flex: 1.6,
            background: HV2.panel, border: `1px solid ${HV2.line}`,
            borderRadius: 16, padding: 28,
          }}
        >
          <div
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              paddingBottom: 14, borderBottom: `1px solid ${HV2.line}`,
            }}
          >
            <div
              style={{
                fontFamily: HV2.fontMono, fontSize: 11, color: HV2.text3,
                letterSpacing: "0.18em", textTransform: "uppercase",
              }}
            >
              hangar-keys · localStorage
            </div>
            <div
              style={{
                background: HV2.accentDim, color: HV2.accent,
                padding: "4px 10px", borderRadius: 999,
                fontFamily: HV2.fontMono, fontSize: 10, fontWeight: 500, letterSpacing: "0.1em",
              }}
            >
              🔒 AES-GCM · YOUR PASSPHRASE
            </div>
          </div>

          {KEYS.map((k, i) => {
            const rT = clamp((localTime - rowStart(i)) / 0.4, 0, 1);
            const isReveal = i === revealRow;
            const showSecret = isReveal && revealT > 0.3;
            const isCopy = isReveal && copyT > 0 && copyT < 1;
            return (
              <div
                key={i}
                style={{
                  display: "grid", gridTemplateColumns: "36px 1fr auto auto",
                  alignItems: "center", gap: 14, padding: "12px 4px",
                  borderBottom: `1px solid ${HV2.lineSoft}`,
                  opacity: rT, transform: `translateX(${(1 - rT) * 16}px)`,
                }}
              >
                <ToolTile tool={k.tool} size={32} radius={6} />
                <div>
                  <div style={{ fontFamily: HV2.fontSans, fontSize: 13, fontWeight: 600, color: HV2.text }}>
                    {k.tool.name}
                  </div>
                  <div style={{ fontFamily: HV2.fontSans, fontSize: 10, color: HV2.text3 }}>{k.label}</div>
                </div>
                <div
                  style={{
                    fontFamily: HV2.fontMono, fontSize: 12, color: HV2.text2,
                    background: HV2.bg2, padding: "5px 10px",
                    borderRadius: 6, border: `1px solid ${HV2.line}`,
                  }}
                >
                  {showSecret ? k.secret : "••••••••••••••••"}
                </div>
                <div style={{ display: "flex", gap: 6, position: "relative" }}>
                  <div
                    style={{
                      width: 26, height: 26,
                      border: `1px solid ${isReveal && revealT > 0 && revealT < 1 ? HV2.accent : HV2.line}`,
                      background: isReveal && revealT > 0 && revealT < 0.9 ? HV2.accentDim : "transparent",
                      borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center",
                      color: showSecret ? HV2.accent : HV2.text3,
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </div>
                  <div
                    style={{
                      width: 26, height: 26,
                      border: `1px solid ${isCopy ? HV2.accent : HV2.line}`,
                      background: isCopy ? HV2.accentDim : "transparent",
                      borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center",
                      color: isCopy ? HV2.accent : HV2.text3, position: "relative",
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                    </svg>
                    {isCopy && copyT > 0.4 && (
                      <div
                        style={{
                          position: "absolute", top: -22, right: 0,
                          background: HV2.accent, color: HV2.bg,
                          padding: "2px 8px", borderRadius: 4,
                          fontFamily: HV2.fontMono, fontSize: 9, fontWeight: 600,
                        }}
                      >
                        COPIED ✓
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-start",
            paddingTop: 12, gap: 18,
          }}
        >
          <div style={{ fontFamily: HV2.fontSans, fontSize: 18, color: HV2.text2, lineHeight: 1.5, maxWidth: 420 }}>
            Tokens live in your browser&apos;s{" "}
            <span style={{ color: HV2.text, fontFamily: HV2.fontMono, fontSize: 16 }}>localStorage</span>{" "}
            — optionally encrypted with a passphrase. No backend. No telemetry.
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {["NO BACKEND", "NO TELEMETRY", "AES-GCM", "BYO KEY"].map((b) => (
              <div
                key={b}
                style={{
                  padding: "6px 12px", borderRadius: 999,
                  background: HV2.bg2, border: `1px solid ${HV2.line}`,
                  fontFamily: HV2.fontMono, fontSize: 11, color: HV2.text2, letterSpacing: "0.1em",
                }}
              >
                {b}
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: 12, padding: "14px 16px",
              background: HV2.bg2, border: `1px solid ${HV2.line}`,
              borderRadius: 10, fontFamily: HV2.fontMono, fontSize: 11,
              color: HV2.text3, lineHeight: 1.5,
            }}
          >
            $ <span style={{ color: HV2.accent }}>localStorage.getItem</span>(<span style={{ color: HV2.text2 }}>&apos;hangar-keys&apos;</span>)
            <br />
            <span style={{ color: HV2.text2 }}>{'> "U2FsdGVkX1+8H…"'}</span>
          </div>
        </div>
      </div>
    </SceneShell>
  );
}

// ════════════════════════════════════════════════════════════════
// SCENE 6 — live integrations carousel (27-36s, 9s)
interface PanelRow {
  a: string;
  b: string;
  c: string;
  d: string;
  warn?: boolean;
}
interface IntegrationPanel {
  tool: ToolDef;
  title: string;
  subtitle: string;
  stat: string;
  rows: PanelRow[];
}

function LiveIntegrationsScene() {
  const { localTime } = useSprite();
  const chromeT = Easing.easeOutCubic(clamp(localTime / 0.4, 0, 1));

  const PANELS: IntegrationPanel[] = [
    {
      tool: TOOLS[1]!, title: "GitHub", subtitle: "@claudevguy",
      stat: "6 recently pushed",
      rows: [
        { a: "hangar", b: "TypeScript", c: "★ 1,284", d: "2m ago" },
        { a: "next-saas-template", b: "TypeScript", c: "★ 482", d: "1h ago" },
        { a: "edge-cron", b: "TypeScript", c: "★ 219", d: "3h ago" },
        { a: "react-keyvault", b: "JavaScript", c: "★ 87", d: "yesterday" },
      ],
    },
    {
      tool: TOOLS[0]!, title: "Vercel", subtitle: "last 24h",
      stat: "4 deployments",
      rows: [
        { a: "hangar / main", b: "Production", c: "✓ Ready", d: "12m ago" },
        { a: "hangar / preview-91", b: "Preview", c: "✓ Ready", d: "38m ago" },
        { a: "edge-cron / main", b: "Production", c: "⚠ Build", d: "2h ago", warn: true },
        { a: "kit / main", b: "Production", c: "✓ Ready", d: "5h ago" },
      ],
    },
    {
      tool: TOOLS[8]!, title: "Linear", subtitle: "assigned to you",
      stat: "7 issues open",
      rows: [
        { a: "HAN-12 · Drag-to-reorder pinned tools", b: "In Progress", c: "P1", d: "today" },
        { a: "HAN-09 · Encrypted vault opt-in", b: "In Review", c: "P2", d: "yesterday" },
        { a: "HAN-08 · Per-tool plans", b: "Done", c: "P2", d: "Tue" },
        { a: "HAN-07 · Compare modal grid", b: "Done", c: "P3", d: "Mon" },
      ],
    },
    {
      tool: TOOLS[6]!, title: "Sentry", subtitle: "production",
      stat: "4 unresolved",
      rows: [
        { a: "TypeError: Cannot read properties of undefined", b: "app.tsx:142", c: "×218", d: "8m ago", warn: true },
        { a: "Failed to fetch /api/github/repos", b: "github.ts:38", c: "×42", d: "1h ago", warn: true },
        { a: "Hydration mismatch — theme attr", b: "main.tsx:21", c: "×12", d: "3h ago" },
        { a: "CORS rejected — Stripe API", b: "stripe.ts:11", c: "×6", d: "yesterday" },
      ],
    },
  ];

  const segLen = 2.1;
  const fade = 0.5;
  const panelOp = (i: number) => {
    const start = i * segLen;
    const end = start + segLen;
    if (localTime < start) return 0;
    if (localTime >= end + fade && i < PANELS.length - 1) return 0;
    if (localTime > end) return clamp(1 - (localTime - end) / fade, 0, 1);
    return clamp((localTime - start) / fade, 0, 1);
  };

  return (
    <SceneShell
      label="04 — Live data"
      title={
        <>
          Drop a token. <span style={{ color: HV2.text3 }}>Live data shows up.</span>
        </>
      }
      opacity={chromeT}
    >
      <div
        style={{
          position: "absolute", right: 60, top: 60,
          display: "flex", alignItems: "center", gap: 8,
        }}
      >
        {PANELS.map((p, i) => {
          const active = panelOp(i) > 0.4;
          return (
            <div
              key={i}
              style={{
                padding: 6, borderRadius: 8,
                border: `1px solid ${active ? HV2.accent : HV2.line}`,
                background: active ? HV2.accentDim : HV2.panel,
                opacity: active ? 1 : 0.45,
                transition: "all .3s",
              }}
            >
              <ToolTile tool={p.tool} size={28} radius={5} />
            </div>
          );
        })}
      </div>

      <div style={{ position: "absolute", left: 60, top: 280, right: 60, bottom: 80 }}>
        {PANELS.map((p, idx) => (
          <div
            key={idx}
            style={{
              position: "absolute", inset: 0,
              opacity: panelOp(idx),
              transition: "opacity .25s",
              background: HV2.panel, border: `1px solid ${HV2.line}`,
              borderRadius: 16, padding: 32,
              display: "flex", flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex", alignItems: "center", gap: 14,
                paddingBottom: 18, borderBottom: `1px solid ${HV2.line}`,
              }}
            >
              <ToolTile tool={p.tool} size={48} radius={8} />
              <div>
                <div style={{ fontFamily: HV2.fontDisplay, fontSize: 26, fontWeight: 600, color: HV2.text }}>
                  {p.title}{" "}
                  <span style={{ color: HV2.text3, fontSize: 14, fontWeight: 400 }}>· {p.subtitle}</span>
                </div>
                <div
                  style={{
                    fontFamily: HV2.fontMono, fontSize: 11, color: HV2.accent,
                    marginTop: 4, letterSpacing: "0.1em",
                  }}
                >
                  ● LIVE · {p.stat}
                </div>
              </div>
              <div style={{ flex: 1 }} />
              <div
                style={{
                  padding: "6px 12px", borderRadius: 999, background: HV2.bg2,
                  border: `1px solid ${HV2.line}`,
                  fontFamily: HV2.fontMono, fontSize: 10, color: HV2.text3, letterSpacing: "0.1em",
                }}
              >
                200 OK · {p.title.toLowerCase()}.com/api
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              {p.rows.map((r, j) => (
                <div
                  key={j}
                  style={{
                    display: "grid", gridTemplateColumns: "2fr 1fr 1fr 0.7fr",
                    alignItems: "center", gap: 16,
                    padding: "14px 4px",
                    borderBottom: `1px solid ${HV2.lineSoft}`,
                    fontFamily: HV2.fontSans, fontSize: 14,
                  }}
                >
                  <div style={{ color: HV2.text, fontWeight: 500 }}>{r.a}</div>
                  <div style={{ color: HV2.text2, fontFamily: HV2.fontMono, fontSize: 12 }}>{r.b}</div>
                  <div
                    style={{
                      color: r.warn ? "#ff8a4c" : HV2.accent,
                      fontFamily: HV2.fontMono, fontSize: 12, fontWeight: 500,
                    }}
                  >
                    {r.c}
                  </div>
                  <div style={{ color: HV2.text3, fontFamily: HV2.fontMono, fontSize: 11, textAlign: "right" }}>
                    {r.d}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SceneShell>
  );
}

// ════════════════════════════════════════════════════════════════
// SCENE 7 — MCP / AI agents (36-44s, 8s)
function MCPScene() {
  const { localTime } = useSprite();
  const chromeT = Easing.easeOutCubic(clamp(localTime / 0.4, 0, 1));

  const ASKS = [
    {
      q: "What's broken on Sentry right now?",
      a: "4 unresolved · top: TypeError in app.tsx:142 (×218 events, last 8m).",
      tool: "list_unresolved_issues",
    },
    {
      q: "Any failed Vercel deploys this week?",
      a: "1 — edge-cron / main · build failed 2h ago. Other 11 deploys ✓.",
      tool: "list_recent_deploys",
    },
    {
      q: "What PRs are waiting on my review?",
      a: "3: hangar #128, kit #44, edge-cron #19 · oldest 6h.",
      tool: "list_review_requests",
    },
  ];

  const askIdx = Math.min(2, Math.floor(localTime / 2.4));
  const inAsk = localTime - askIdx * 2.4;
  const qShown = (i: number) => {
    if (i > askIdx) return "";
    if (i < askIdx) return ASKS[i]!.q;
    const t = clamp(inAsk / 0.9, 0, 1);
    const len = Math.floor(t * ASKS[i]!.q.length + 0.001);
    return ASKS[i]!.q.slice(0, len);
  };
  const showA = (i: number) => {
    if (i > askIdx) return 0;
    if (i < askIdx) return 1;
    return clamp((inAsk - 1.0) / 0.5, 0, 1);
  };
  const showTool = (i: number) => {
    if (i > askIdx) return 0;
    if (i < askIdx) return 1;
    return clamp((inAsk - 0.95) / 0.3, 0, 1);
  };

  return (
    <SceneShell
      label="05 — MCP"
      title={
        <>
          Your stack, <span style={{ color: HV2.accent }}>readable by your agent.</span>
        </>
      }
      opacity={chromeT}
    >
      <div
        style={{
          position: "absolute", left: 60, top: 280, right: 60, bottom: 80,
          display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 32,
        }}
      >
        <div
          style={{
            background: HV2.panel, border: `1px solid ${HV2.line}`, borderRadius: 16,
            padding: 28, display: "flex", flexDirection: "column", gap: 14, overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              paddingBottom: 14, borderBottom: `1px solid ${HV2.line}`,
            }}
          >
            <div
              style={{
                fontFamily: HV2.fontMono, fontSize: 11, color: HV2.text3,
                letterSpacing: "0.16em", textTransform: "uppercase",
              }}
            >
              Claude Desktop · hangar-mcp
            </div>
            <div style={{ fontFamily: HV2.fontMono, fontSize: 10, color: HV2.accent, letterSpacing: "0.1em" }}>
              ● 6 TOOLS CONNECTED
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18, overflowY: "hidden", flex: 1 }}>
            {ASKS.map((a, i) =>
              i <= askIdx && (
                <div key={i}>
                  <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
                    <div
                      style={{
                        width: 28, height: 28, borderRadius: 14,
                        background: HV2.bg2, color: HV2.text2,
                        fontFamily: HV2.fontMono, fontSize: 12, fontWeight: 600,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      U
                    </div>
                    <div style={{ fontFamily: HV2.fontSans, fontSize: 16, color: HV2.text, lineHeight: 1.5 }}>
                      {qShown(i)}
                      {i === askIdx && qShown(i).length < a.q.length ? (
                        <span style={{ color: HV2.accent }}>|</span>
                      ) : null}
                    </div>
                  </div>

                  {showTool(i) > 0 && (
                    <div
                      style={{
                        margin: "0 0 10px 40px",
                        padding: "8px 12px",
                        background: HV2.bg2, border: `1px solid ${HV2.line}`,
                        borderRadius: 8,
                        fontFamily: HV2.fontMono, fontSize: 11, color: HV2.text2,
                        opacity: showTool(i),
                        display: "inline-flex", alignItems: "center", gap: 8,
                      }}
                    >
                      <span style={{ color: HV2.accent }}>⚡</span>
                      <span style={{ color: HV2.text3 }}>tool</span>
                      <span style={{ color: HV2.text }}>{a.tool}</span>
                      <span style={{ color: HV2.text3 }}>·</span>
                      <span style={{ color: HV2.accent }}>200 OK</span>
                    </div>
                  )}

                  {showA(i) > 0 && (
                    <div
                      style={{
                        display: "flex", gap: 12,
                        opacity: showA(i),
                        transform: `translateY(${(1 - showA(i)) * 6}px)`,
                      }}
                    >
                      <div
                        style={{
                          width: 28, height: 28, borderRadius: 14,
                          background: HV2.accent, color: HV2.bg,
                          fontFamily: HV2.fontDisplay, fontSize: 13, fontWeight: 700,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        H
                      </div>
                      <div
                        style={{
                          fontFamily: HV2.fontSans, fontSize: 15, color: HV2.text2,
                          lineHeight: 1.5, maxWidth: 600,
                        }}
                      >
                        {a.a}
                      </div>
                    </div>
                  )}
                </div>
              ),
            )}
          </div>
        </div>

        <div
          style={{
            background: HV2.panel, border: `1px solid ${HV2.line}`, borderRadius: 16,
            padding: 24, display: "flex", flexDirection: "column", gap: 12,
          }}
        >
          <div
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              paddingBottom: 12, borderBottom: `1px solid ${HV2.line}`,
            }}
          >
            <div
              style={{
                fontFamily: HV2.fontMono, fontSize: 11, color: HV2.text3,
                letterSpacing: "0.16em", textTransform: "uppercase",
              }}
            >
              mcp.json
            </div>
            <div
              style={{
                padding: "4px 10px", background: HV2.accentDim, color: HV2.accent,
                borderRadius: 999, fontFamily: HV2.fontMono, fontSize: 9,
                letterSpacing: "0.1em", fontWeight: 600,
              }}
            >
              ↓ DOWNLOAD
            </div>
          </div>

          <pre
            style={{
              margin: 0, fontFamily: HV2.fontMono, fontSize: 12, color: HV2.text2,
              lineHeight: 1.55, whiteSpace: "pre-wrap",
            }}
          >
            {`"hangar": {`}
            <br />
            {`  "command": "npx hangar-mcp",`}
            <br />
            {`  "env": {`}
            <br />
            <span style={{ color: HV2.accent }}>{`    "GITHUB_TOKEN":`}</span> {`"…",`}
            <br />
            <span style={{ color: HV2.accent }}>{`    "SENTRY_TOKEN":`}</span> {`"…",`}
            <br />
            <span style={{ color: HV2.accent }}>{`    "VERCEL_TOKEN":`}</span> {`"…",`}
            <br />
            <span style={{ color: HV2.accent }}>{`    "LINEAR_TOKEN":`}</span> {`"…",`}
            <br />
            <span style={{ color: HV2.accent }}>{`    "STRIPE_TOKEN":`}</span> {`"…"`}
            <br />
            {`  }`}
            <br />
            {`}`}
          </pre>

          <div
            style={{
              marginTop: "auto", paddingTop: 12, borderTop: `1px solid ${HV2.lineSoft}`,
              fontFamily: HV2.fontSans, fontSize: 13, color: HV2.text3, lineHeight: 1.5,
            }}
          >
            6 tools today:{" "}
            {[
              "read_stack",
              "list_unresolved_issues",
              "list_recent_deploys",
              "list_assigned_issues",
              "list_review_requests",
              "get_recent_revenue",
            ].map((name, i, arr) => (
              <span key={name}>
                <span style={{ color: HV2.text2, fontFamily: HV2.fontMono, fontSize: 11 }}>{name}</span>
                {i < arr.length - 1 ? ", " : "."}
              </span>
            ))}
          </div>
        </div>
      </div>
    </SceneShell>
  );
}

// ════════════════════════════════════════════════════════════════
// SCENE 8 — settings (44-48s, 4s)
function SettingsScene() {
  const { localTime } = useSprite();
  const chromeT = Easing.easeOutCubic(clamp(localTime / 0.3, 0, 1));

  const accents = [
    { name: "Neon green", c: "#9eff64" },
    { name: "Ember", c: "#ff8a4c" },
    { name: "Violet", c: "#a78bfa" },
    { name: "Ice", c: "#7dd3fc" },
    { name: "Paper", c: "#f6f4ef" },
  ];
  const accentIdx = Math.min(4, Math.floor(localTime / 0.7));
  const activeAccent = accents[accentIdx]!.c;

  const cardStyleIdx = localTime < 2.0 ? 0 : localTime < 3.0 ? 1 : 2;
  const densityIdx = localTime > 1.4 ? 1 : 0;

  return (
    <SceneShell
      label="06 — Make it yours"
      title="Five accents. Three card styles. Two densities."
      accent={activeAccent}
      opacity={chromeT}
    >
      <div
        style={{
          position: "absolute", left: 60, top: 270, right: 60, bottom: 60,
          display: "grid", gridTemplateColumns: "320px 1fr", gap: 32,
        }}
      >
        <div
          style={{
            background: HV2.panel, border: `1px solid ${HV2.line}`, borderRadius: 14, padding: 22,
            display: "flex", flexDirection: "column", gap: 22, alignSelf: "flex-start",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: HV2.fontMono, fontSize: 10, color: HV2.text3,
                letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 10,
              }}
            >
              ACCENT
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {accents.map((a, i) => (
                <div
                  key={a.name}
                  style={{
                    width: 36, height: 36, borderRadius: 8, background: a.c,
                    border: `2px solid ${i === accentIdx ? HV2.text : "transparent"}`,
                    boxShadow: i === accentIdx ? `0 0 0 2px ${a.c}` : "none",
                  }}
                />
              ))}
            </div>
          </div>
          <div>
            <div
              style={{
                fontFamily: HV2.fontMono, fontSize: 10, color: HV2.text3,
                letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 10,
              }}
            >
              DENSITY
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {["Comfy", "Compact"].map((d, i) => (
                <div
                  key={d}
                  style={{
                    flex: 1, padding: "10px 14px", borderRadius: 8,
                    border: `1px solid ${i === densityIdx ? activeAccent : HV2.line}`,
                    background: i === densityIdx ? `${activeAccent}22` : HV2.bg2,
                    color: i === densityIdx ? activeAccent : HV2.text2,
                    fontFamily: HV2.fontSans, fontSize: 13, fontWeight: 500, textAlign: "center",
                  }}
                >
                  {d}
                </div>
              ))}
            </div>
          </div>
          <div>
            <div
              style={{
                fontFamily: HV2.fontMono, fontSize: 10, color: HV2.text3,
                letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 10,
              }}
            >
              CARD STYLE
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {["Minimal", "Bordered", "Glow"].map((s, i) => (
                <div
                  key={s}
                  style={{
                    flex: 1, padding: "10px 14px", borderRadius: 8,
                    border: `1px solid ${i === cardStyleIdx ? activeAccent : HV2.line}`,
                    background: i === cardStyleIdx ? `${activeAccent}22` : HV2.bg2,
                    color: i === cardStyleIdx ? activeAccent : HV2.text2,
                    fontFamily: HV2.fontSans, fontSize: 13, fontWeight: 500, textAlign: "center",
                  }}
                >
                  {s}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            background: HV2.panel, border: `1px solid ${HV2.line}`, borderRadius: 14, padding: 28,
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
            gap: densityIdx === 0 ? 16 : 8,
          }}
        >
          {TOOLS.slice(0, 8).map((t) => {
            const minimal = cardStyleIdx === 0;
            const bordered = cardStyleIdx === 1;
            const glow = cardStyleIdx === 2;
            return (
              <div
                key={t.id}
                style={{
                  padding: densityIdx === 0 ? 16 : 10,
                  background: HV2.bg2,
                  border: minimal
                    ? `1px solid transparent`
                    : bordered
                      ? `1px solid ${activeAccent}`
                      : `1px solid ${HV2.line}`,
                  boxShadow: glow ? `0 0 24px ${activeAccent}55` : "none",
                  borderRadius: 10, display: "flex", flexDirection: "column",
                  gap: densityIdx === 0 ? 10 : 6,
                  transition: "all .35s",
                }}
              >
                <ToolTile tool={t} size={densityIdx === 0 ? 36 : 26} radius={6} />
                <div
                  style={{
                    fontFamily: HV2.fontSans, fontSize: densityIdx === 0 ? 13 : 11,
                    fontWeight: 600, color: HV2.text,
                  }}
                >
                  {t.name}
                </div>
                <div
                  style={{
                    fontFamily: HV2.fontMono, fontSize: 9, color: activeAccent,
                    textTransform: "uppercase", letterSpacing: "0.14em",
                  }}
                >
                  ● LIVE
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SceneShell>
  );
}

// ════════════════════════════════════════════════════════════════
// SCENE 9 — End card (48-52s, 4s)
function EndScene() {
  const { localTime } = useSprite();
  const t1 = Easing.easeOutCubic(clamp(localTime / 0.6, 0, 1));
  const t2 = clamp((localTime - 0.5) / 0.5, 0, 1);
  const t3 = clamp((localTime - 1.0) / 0.5, 0, 1);
  const t4 = clamp((localTime - 1.6) / 0.5, 0, 1);

  const radialMask: CSSProperties = {
    maskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)",
    WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)",
  };

  return (
    <div
      style={{
        position: "absolute", inset: 0, background: HV2.bg,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "absolute", width: 1200, height: 1200, borderRadius: "50%",
          background: `radial-gradient(circle, ${HV2.accent} 0%, transparent 60%)`,
          opacity: 0.08 * t1, filter: "blur(120px)",
        }}
      />
      <div
        style={{
          position: "absolute", inset: 0,
          backgroundImage: `linear-gradient(${HV2.line} 1px, transparent 1px), linear-gradient(90deg, ${HV2.line} 1px, transparent 1px)`,
          backgroundSize: "64px 64px", opacity: 0.3,
          ...radialMask,
        }}
      />
      <div
        style={{
          fontFamily: HV2.fontDisplay, fontSize: 240, fontWeight: 700,
          letterSpacing: "-0.05em", color: HV2.text,
          opacity: t1, transform: `scale(${0.94 + 0.06 * t1})`,
          position: "relative", lineHeight: 1,
        }}
      >
        Hangar<span style={{ color: HV2.accent }}>.</span>
      </div>
      <div
        style={{
          fontFamily: HV2.fontDisplay, fontSize: 32, fontWeight: 500, color: HV2.text2,
          marginTop: 20, opacity: t2,
          transform: `translateY(${(1 - t2) * 14}px)`, letterSpacing: "-0.01em",
        }}
      >
        Park your stack in the hangar.
      </div>
      <div
        style={{
          marginTop: 56, padding: "18px 36px",
          background: HV2.accent, color: HV2.bg, borderRadius: 999,
          fontFamily: HV2.fontSans, fontSize: 18, fontWeight: 600,
          opacity: t3,
          transform: `translateY(${(1 - t3) * 14}px) scale(${0.94 + 0.06 * t3})`,
          boxShadow: `0 0 60px ${HV2.accent}66`,
        }}
      >
        Stack Up
      </div>
      <div
        style={{
          marginTop: 24,
          fontFamily: HV2.fontMono, fontSize: 13, color: HV2.text3,
          letterSpacing: "0.14em", textTransform: "uppercase", opacity: t4,
        }}
      >
        github.com/claudevguy/hangar · MIT · local-first
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Master composition — exported as `HangarShowcase` so Showcase.tsx
// keeps importing the same name.
export function HangarShowcase() {
  return (
    <>
      <Sprite start={0} end={4}><ChaosScene /></Sprite>
      <Sprite start={4} end={8}><WordmarkScene /></Sprite>
      <Sprite start={8} end={15}><CatalogScene /></Sprite>
      <Sprite start={15} end={21}><CompareScene /></Sprite>
      <Sprite start={21} end={27}><VaultScene /></Sprite>
      <Sprite start={27} end={36}><LiveIntegrationsScene /></Sprite>
      <Sprite start={36} end={44}><MCPScene /></Sprite>
      <Sprite start={44} end={48}><SettingsScene /></Sprite>
      <Sprite start={48} end={52}><EndScene /></Sprite>
    </>
  );
}
