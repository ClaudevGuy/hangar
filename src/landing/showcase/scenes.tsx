import { Sprite, useSprite, Easing, clamp } from "./animations";

const HV = {
  bg: "#0a0a0a",
  bg2: "#111",
  panel: "#161616",
  line: "#222",
  text: "#f6f4ef",
  text2: "#a8a39a",
  text3: "#5e5a52",
  accent: "#9eff64",
  accentDim: "rgba(158,255,100,0.18)",
  fontDisplay: '"Bricolage Grotesque", system-ui, sans-serif',
  fontSans: '"Geist", system-ui, sans-serif',
  fontMono: '"Geist Mono", ui-monospace, monospace',
};

const lightHV = {
  bg: "#f6f4ef",
  bg2: "#ecebe4",
  panel: "#ffffff",
  line: "#dad6cc",
  text: "#1a1a1a",
  text2: "#5a5650",
  text3: "#8e887e",
  accent: "#2d8b3a",
  accentDim: "rgba(45,139,58,0.12)",
};

interface ShowcaseTool {
  id: string;
  name: string;
  color: string;
  bg: string;
  logo: string;
}

const HEROES: ShowcaseTool[] = [
  { id: "vercel", name: "Vercel", color: "#fff", bg: "#000", logo: '<svg viewBox="0 0 76 65" fill="currentColor"><path d="M37.59.25l36.95 64H.64l36.95-64z"/></svg>' },
  { id: "github", name: "GitHub", color: "#fff", bg: "#0d1117", logo: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .3a12 12 0 00-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.3-3.1-.2-.4-.6-1.6 0-3.2 0 0 1-.3 3.4 1.2a11.5 11.5 0 016 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.6.2 2.8.1 3.2.7.8 1.3 1.9 1.3 3.1 0 4.6-2.8 5.6-5.5 5.9.5.4.9 1.2.9 2.4v3.5c0 .3.1.7.8.6A12 12 0 0012 .3z"/></svg>' },
  { id: "neon", name: "Neon", color: "#00E599", bg: "#001A0D", logo: '<svg viewBox="0 0 100 100" fill="currentColor"><path d="M10 25c0-8 7-15 15-15h50c8 0 15 7 15 15v40L60 30v40H25c-8 0-15-7-15-15V25z"/></svg>' },
  { id: "clerk", name: "Clerk", color: "#6C47FF", bg: "#0F0A24", logo: '<svg viewBox="0 0 100 100" fill="currentColor"><circle cx="50" cy="50" r="40"/></svg>' },
  { id: "stripe", name: "Stripe", color: "#635BFF", bg: "#0E0D26", logo: '<svg viewBox="0 0 100 100" fill="currentColor"><path d="M30 30h40v15H50v10c0 5 5 10 15 10v15c-25 0-30-15-30-25V30z"/></svg>' },
  { id: "resend", name: "Resend", color: "#fff", bg: "#000", logo: '<svg viewBox="0 0 100 100" fill="currentColor"><path d="M20 25h45c10 0 18 8 18 18s-8 18-18 18H40v15h-20V25zm20 18v15h22c4 0 7-3 7-7s-3-8-7-8H40z"/></svg>' },
  { id: "sentry", name: "Sentry", color: "#362d59", bg: "#fff", logo: '<svg viewBox="0 0 100 100" fill="currentColor"><path d="M50 15l35 60H70c-2-12-12-22-25-22v-15c20 0 35 16 38 37H30L50 40l5 8c8 2 14 9 16 17h6L50 30 25 75H15z"/></svg>' },
  { id: "figma", name: "Figma", color: "#f24e1e", bg: "#0f0f0f", logo: '<svg viewBox="0 0 100 100" fill="currentColor"><circle cx="65" cy="50" r="15"/><path d="M35 5h30v30H35a15 15 0 010-30zm0 30h30v30H35a15 15 0 010-30zm0 30h30v30a15 15 0 01-30 0V65z"/></svg>' },
  { id: "linear", name: "Linear", color: "#5e6ad2", bg: "#0a0a14", logo: '<svg viewBox="0 0 100 100" fill="currentColor"><path d="M5 60c0-25 20-45 45-45s45 20 45 45H80c0-17-13-30-30-30s-30 13-30 30H5zm20 5c0-14 11-25 25-25s25 11 25 25H60c0-6-5-10-10-10s-10 4-10 10H25z"/></svg>' },
  { id: "anthropic", name: "Anthropic", color: "#cc785c", bg: "#1a1410", logo: '<svg viewBox="0 0 100 100" fill="currentColor"><path d="M30 80L50 20l20 60h-12l-3-10H45l-3 10H30zm17-22h6l-3-12-3 12z"/></svg>' },
];

const TAB_TITLES = [
  "Vercel — Project", "GitHub — pulls/3", "Neon — Dashboard", "Clerk — Users", "Stripe — Payments",
  "Resend — Inbox", "Sentry — Issues 4", "Figma — Drafts", "Linear — HAN-12", "Anthropic Console",
  "PostHog — Replays", "Inngest — Runs", "Discord — #eng", "Notion — Roadmap", "Slack — DMs",
  "Tailscale", "Plausible", "Dub.co", "Loops", "Cron", "Highlight", "Fly — Logs", "Supabase",
  "Convex", "Resend", "OpenAI Console", "Polar", "Liveblocks", "Algolia", "Trigger.dev",
  "Cloudflare", "Railway", "Render", "PlanetScale", "Upstash", "Pulumi", "Auth0", "WorkOS",
  "Statsig", "Vercel Analytics", "Logflare", "Better Stack", "Cron-job", "Datadog", "Knock",
  "Crisp", "Plain",
];

interface ToolTileProps {
  tool: ShowcaseTool;
  size?: number;
  radius?: number;
  opacity?: number;
  scale?: number;
}

function ToolTile({ tool, size = 56, radius = 10, opacity = 1, scale = 1 }: ToolTileProps) {
  return (
    <div style={{
      width: size, height: size,
      background: tool.bg, color: tool.color,
      borderRadius: radius,
      display: "flex", alignItems: "center", justifyContent: "center",
      transform: `scale(${scale})`,
      transformOrigin: "center",
      opacity,
      boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
    }}>
      <div style={{ width: size * 0.5, height: size * 0.5 }}
           dangerouslySetInnerHTML={{ __html: tool.logo }} />
    </div>
  );
}

// SCENE 1 — chaos tabs (0-4s)
function ChaosScene() {
  const { localTime } = useSprite();

  const tabsShown = Math.min(TAB_TITLES.length, Math.floor(localTime * 16));
  const counterTabs = Math.floor(localTime * 18);

  const shakeStart = 2.6;
  const shakeT = Math.max(0, localTime - shakeStart) / 1.4;
  const shakeAmp = shakeT * 8;
  const shakeX = Math.sin(localTime * 80) * shakeAmp;
  const shakeY = Math.cos(localTime * 70) * shakeAmp;

  const flashIntensity = localTime > 3.4 ? Math.max(0, 1 - (localTime - 3.4) / 0.4) : 0;

  return (
    <div style={{
      position: "absolute", inset: 0,
      background: HV.bg,
      transform: `translate(${shakeX}px, ${shakeY}px)`,
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 88,
        background: "#1c1c1c",
        borderBottom: `1px solid ${HV.line}`,
        display: "flex", flexWrap: "wrap", alignItems: "flex-start",
        padding: "12px 24px 0",
        gap: 2,
      }}>
        {TAB_TITLES.slice(0, tabsShown).map((t, i) => (
          <div key={i} style={{
            height: 30,
            minWidth: 24,
            maxWidth: 140,
            padding: "0 10px",
            background: i === tabsShown - 1 ? "#2a2a2a" : "#222",
            borderRadius: "6px 6px 0 0",
            color: HV.text2,
            fontFamily: HV.fontSans,
            fontSize: 11,
            display: "flex", alignItems: "center",
            gap: 6,
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            flexShrink: 1,
          }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: i % 4 === 0 ? "#9eff64" : i % 4 === 1 ? "#3b82f6" : i % 4 === 2 ? "#f59e0b" : "#ef4444", flexShrink: 0 }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{t}</span>
          </div>
        ))}
      </div>

      <div style={{
        position: "absolute",
        left: "50%", top: "52%",
        transform: "translate(-50%, -50%)",
        textAlign: "center",
      }}>
        <div style={{
          fontFamily: HV.fontMono, fontSize: 18,
          color: "#ef4444", letterSpacing: "0.3em",
          textTransform: "uppercase", marginBottom: 24,
          opacity: localTime > 1.2 ? 1 : 0,
          transition: "opacity .3s",
        }}>
          OPEN TABS
        </div>
        <div style={{
          fontFamily: HV.fontDisplay, fontSize: 320, fontWeight: 700,
          color: HV.text, letterSpacing: "-0.06em", lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
          textShadow: shakeT > 0 ? `0 0 ${shakeT * 30}px rgba(239,68,68,0.6)` : "none",
        }}>
          {String(Math.min(counterTabs, 47)).padStart(2, "0")}
        </div>
        <div style={{
          fontFamily: HV.fontSans, fontSize: 22,
          color: HV.text3, marginTop: 24,
          opacity: localTime > 2 ? 1 : 0,
          transition: "opacity .4s",
        }}>
          across 12 tools · 4 dashboards · 3 hours of context-switching
        </div>
      </div>

      <div style={{
        position: "absolute", inset: 0,
        background: `rgba(239,68,68,${flashIntensity * 0.18})`,
        pointerEvents: "none",
      }} />
    </div>
  );
}

// SCENE 2 — wordmark reveal (4-8s)
function WordmarkScene() {
  const { localTime } = useSprite();

  const flashOpacity = Math.max(0, 1 - localTime / 0.4);

  const wmT = Easing.easeOutBack(clamp((localTime - 0.3) / 0.9, 0, 1));
  const wmExit = localTime > 3.4 ? Easing.easeInCubic((localTime - 3.4) / 0.6) : 0;
  const wmScale = 0.7 + wmT * 0.3 + wmExit * 0.05;
  const wmOpacity = clamp(wmT - wmExit, 0, 1);

  const tagOpacity = clamp((localTime - 1.4) / 0.5 - wmExit, 0, 1);
  const tagY = (1 - clamp((localTime - 1.4) / 0.5, 0, 1)) * 20;

  const ulProgress = Easing.easeOutQuart(clamp((localTime - 1.0) / 1.6, 0, 1));

  return (
    <div style={{
      position: "absolute", inset: 0,
      background: HV.bg,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `linear-gradient(${HV.line} 1px, transparent 1px), linear-gradient(90deg, ${HV.line} 1px, transparent 1px)`,
        backgroundSize: "64px 64px",
        opacity: 0.4,
        maskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)",
      }} />

      <div style={{
        position: "absolute",
        width: 800, height: 800,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${HV.accent} 0%, transparent 60%)`,
        opacity: 0.12 * wmOpacity,
        filter: "blur(80px)",
      }} />

      <div style={{
        fontFamily: HV.fontDisplay,
        fontSize: 280, fontWeight: 700,
        letterSpacing: "-0.05em",
        color: HV.text,
        transform: `scale(${wmScale})`,
        opacity: wmOpacity,
        position: "relative",
      }}>
        Hangar<span style={{ color: HV.accent }}>.</span>
      </div>

      <svg width="540" height="14" style={{ marginTop: -28, opacity: wmOpacity }}>
        <line x1="0" y1="6" x2={540 * ulProgress} y2="6"
              stroke={HV.accent} strokeWidth="3" strokeLinecap="round" />
      </svg>

      <div style={{
        fontFamily: HV.fontSans, fontSize: 26, color: HV.text2,
        marginTop: 32, opacity: tagOpacity,
        transform: `translateY(${tagY}px)`,
        letterSpacing: "0.02em",
      }}>
        Your stack. <span style={{ color: HV.text }}>One screen.</span>
      </div>

      <div style={{
        position: "absolute", inset: 0,
        background: "#fff", opacity: flashOpacity,
        pointerEvents: "none",
      }} />
    </div>
  );
}

// SCENE 3 — pin flow (8-16s)
function PinScene() {
  const { localTime } = useSprite();

  const chromeT = Easing.easeOutCubic(clamp(localTime / 0.8, 0, 1));

  const queryFull = "auth";
  const queryStart = 5.4;
  const queryT = clamp((localTime - queryStart) / 0.6, 0, 1);
  const queryShown = queryFull.slice(0, Math.floor(queryT * queryFull.length + 0.001));
  const filterActive = localTime > 5.4;

  const flyStart = 1.6;
  const tools = HEROES.slice(0, 10);

  return (
    <div style={{
      position: "absolute", inset: 0,
      background: HV.bg,
      padding: 60,
      opacity: chromeT,
    }}>
      <div style={{
        background: HV.panel,
        border: `1px solid ${HV.line}`,
        borderRadius: 16,
        height: "100%",
        overflow: "hidden",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{
          height: 56,
          borderBottom: `1px solid ${HV.line}`,
          display: "flex", alignItems: "center",
          padding: "0 24px", gap: 14,
        }}>
          <div style={{
            fontFamily: HV.fontDisplay, fontWeight: 700, fontSize: 18, color: HV.text,
          }}>
            Hangar<span style={{ color: HV.accent }}>.</span>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: HV.bg2, border: `1px solid ${HV.line}`,
            borderRadius: 8, padding: "8px 14px",
            width: 380,
            color: HV.text3, fontFamily: HV.fontSans, fontSize: 14,
          }}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
            </svg>
            <span style={{ color: filterActive ? HV.text : HV.text3 }}>{queryShown || "Search 30 tools…"}</span>
            {filterActive && <span style={{
              marginLeft: "auto", color: HV.accent, fontFamily: HV.fontMono, fontSize: 11,
            }}>{queryShown ? "|" : ""}</span>}
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
          <div style={{
            width: 220, borderRight: `1px solid ${HV.line}`,
            padding: "24px 18px",
            display: "flex", flexDirection: "column", gap: 4,
            fontFamily: HV.fontSans, fontSize: 13,
          }}>
            <div style={{
              color: HV.text3, fontFamily: HV.fontMono, fontSize: 10,
              textTransform: "uppercase", letterSpacing: "0.16em", margin: "0 0 8px 6px",
            }}>Categories</div>
            {["Hosting", "Database", "Auth", "AI", "Design", "Email", "Payments", "Monitoring"].map((c) => {
              const isActive = filterActive && c === "Auth";
              return (
                <div key={c} style={{
                  padding: "8px 10px",
                  borderRadius: 6,
                  background: isActive ? HV.accentDim : "transparent",
                  color: isActive ? HV.accent : HV.text2,
                  fontWeight: isActive ? 600 : 400,
                  display: "flex", justifyContent: "space-between",
                }}>
                  <span>{c}</span>
                  <span style={{ color: HV.text3, fontFamily: HV.fontMono, fontSize: 10 }}>
                    {c === "Auth" ? "4" : c === "Database" ? "6" : c === "AI" ? "5" : "3"}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ flex: 1, padding: 32, position: "relative" }}>
            <div style={{
              fontFamily: HV.fontMono, fontSize: 11, color: HV.text3,
              textTransform: "uppercase", letterSpacing: "0.16em", marginBottom: 18,
            }}>
              Catalog · 30 tools
            </div>
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16,
            }}>
              {tools.map((t, i) => {
                const tStart = flyStart + i * 0.08;
                const tProg = Easing.easeOutBack(clamp((localTime - tStart) / 0.6, 0, 1));

                const isPinned = i < 5;
                const pinStart = 3.0 + i * 0.18;
                const pinT = isPinned ? Easing.easeInOutCubic(clamp((localTime - pinStart) / 0.7, 0, 1)) : 0;

                const isAuthMatch = ["clerk"].includes(t.id);
                const dimT = filterActive && !isAuthMatch ? clamp((localTime - 5.6) / 0.4, 0, 1) : 0;

                return (
                  <div key={t.id} style={{
                    border: `1px solid ${pinT > 0.1 ? HV.accent : HV.line}`,
                    borderRadius: 10,
                    padding: 16,
                    background: pinT > 0.1 ? HV.accentDim : HV.bg,
                    display: "flex", flexDirection: "column", gap: 10,
                    opacity: tProg * (1 - dimT * 0.7),
                    transform: `translateY(${(1 - tProg) * 30}px) scale(${tProg})`,
                    transition: "border .3s",
                    position: "relative",
                  }}>
                    {pinT > 0.5 && (
                      <div style={{
                        position: "absolute", top: 8, right: 8,
                        width: 8, height: 8, borderRadius: "50%",
                        background: HV.accent,
                        boxShadow: `0 0 8px ${HV.accent}`,
                      }} />
                    )}
                    <ToolTile tool={t} size={36} radius={6} />
                    <div style={{
                      fontFamily: HV.fontSans, fontSize: 13, fontWeight: 600,
                      color: HV.text,
                    }}>{t.name}</div>
                    <div style={{
                      fontFamily: HV.fontMono, fontSize: 9, color: HV.text3,
                      textTransform: "uppercase", letterSpacing: "0.14em",
                    }}>
                      {pinT > 0.5 ? "✓ PINNED" : "PIN +"}
                    </div>
                  </div>
                );
              })}
            </div>

            {(() => {
              const cap1Op = clamp((localTime - 4.4) / 0.5, 0, 1) - clamp((localTime - 5.4) / 0.3, 0, 1);
              const cap2Op = clamp((localTime - 5.7) / 0.4, 0, 1);
              return (
                <div style={{
                  position: "absolute", bottom: 32, left: 32, right: 32,
                  fontFamily: HV.fontDisplay, fontSize: 38, fontWeight: 600,
                  color: HV.text, letterSpacing: "-0.02em",
                  height: 50,
                }}>
                  <div style={{ position: "absolute", inset: 0, opacity: cap1Op }}>
                    <span style={{ color: HV.accent }}>01</span> &nbsp;Pin every tool you use.
                  </div>
                  <div style={{ position: "absolute", inset: 0, opacity: cap2Op }}>
                    Search by name. <span style={{ color: HV.accent }}>Filter by category.</span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

// SCENE 4 — vault (16-24s)
function VaultScene() {
  const { localTime } = useSprite();

  const chromeT = Easing.easeOutCubic(clamp(localTime / 0.6, 0, 1));

  const KEYS = [
    { tool: HEROES[1], label: "Personal Access Token", secret: "ghp_a1b2c3d4e5f6g7h8i9j0" },
    { tool: HEROES[2], label: "Production", secret: "pg_live_neon_84jH3kdL2mN8pQ4r" },
    { tool: HEROES[3], label: "Backend secret", secret: "sk_live_clerk_42xJ8nF1pZ4vK9b" },
    { tool: HEROES[4], label: "Live secret", secret: "sk_live_stripe_91pQ8nM4rT7v2eK" },
    { tool: HEROES[5], label: "Sending key", secret: "re_a8B3xY7vK9pL4mN2qR" },
    { tool: HEROES[9], label: "Workspace API", secret: "sk-ant-api03-zX9pQ4rT7v2eKn" },
  ];

  const rowStart = (i: number) => 0.6 + i * 0.22;

  const revealRow = 3;
  const revealStart = 4.0;
  const revealT = clamp((localTime - revealStart) / 0.5, 0, 1);

  const copyStart = 5.5;
  const copyT = clamp((localTime - copyStart) / 0.6, 0, 1);

  const lockOpacity = clamp((localTime - 6.6) / 0.5, 0, 1);

  return (
    <div style={{
      position: "absolute", inset: 0,
      background: HV.bg,
      padding: 60,
      opacity: chromeT,
      display: "flex", gap: 32,
    }}>
      <div style={{
        flex: 1.4,
        background: HV.panel,
        border: `1px solid ${HV.line}`,
        borderRadius: 16,
        padding: 32,
        display: "flex", flexDirection: "column",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          paddingBottom: 18,
          borderBottom: `1px solid ${HV.line}`,
        }}>
          <div>
            <div style={{
              fontFamily: HV.fontMono, fontSize: 11, color: HV.text3,
              textTransform: "uppercase", letterSpacing: "0.18em",
            }}>The vault</div>
            <div style={{
              fontFamily: HV.fontDisplay, fontSize: 28, fontWeight: 600, color: HV.text,
              marginTop: 6,
            }}>Keys</div>
          </div>
          <div style={{
            background: HV.accentDim, color: HV.accent,
            padding: "6px 12px", borderRadius: 999,
            fontFamily: HV.fontMono, fontSize: 11,
            fontWeight: 500,
          }}>
            🔒 LOCAL ONLY
          </div>
        </div>

        <div style={{ marginTop: 8 }}>
          {KEYS.map((k, i) => {
            const rT = clamp((localTime - rowStart(i)) / 0.4, 0, 1);
            const isRevealRow = i === revealRow;
            const showSecret = isRevealRow && revealT > 0.3;
            const isCopying = isRevealRow && copyT > 0 && copyT < 1;

            return (
              <div key={i} style={{
                display: "grid",
                gridTemplateColumns: "40px 1fr auto auto",
                alignItems: "center", gap: 16,
                padding: "16px 8px",
                borderBottom: `1px solid ${HV.line}`,
                opacity: rT,
                transform: `translateX(${(1 - rT) * 20}px)`,
              }}>
                <ToolTile tool={k.tool} size={36} radius={6} />
                <div>
                  <div style={{ fontFamily: HV.fontSans, fontSize: 14, fontWeight: 600, color: HV.text }}>
                    {k.tool.name}
                  </div>
                  <div style={{ fontFamily: HV.fontSans, fontSize: 11, color: HV.text3 }}>
                    {k.label}
                  </div>
                </div>
                <div style={{
                  fontFamily: HV.fontMono, fontSize: 13, color: HV.text2,
                  background: HV.bg2, padding: "6px 12px",
                  borderRadius: 6, border: `1px solid ${HV.line}`,
                  letterSpacing: "0.04em",
                }}>
                  {showSecret ? k.secret : "••••••••••••••••"}
                </div>
                <div style={{
                  display: "flex", gap: 6,
                }}>
                  <div style={{
                    width: 28, height: 28,
                    border: `1px solid ${isRevealRow && revealT > 0.1 && revealT < 1 ? HV.accent : HV.line}`,
                    borderRadius: 5,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: showSecret ? HV.accent : HV.text3,
                    background: isRevealRow && revealT > 0.05 && revealT < 0.9 ? HV.accentDim : "transparent",
                  }}>
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  </div>
                  <div style={{
                    width: 28, height: 28,
                    border: `1px solid ${isCopying ? HV.accent : HV.line}`,
                    borderRadius: 5,
                    background: isCopying ? HV.accentDim : "transparent",
                    color: isCopying ? HV.accent : HV.text3,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    position: "relative",
                  }}>
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                    </svg>
                    {isCopying && copyT > 0.4 && (
                      <div style={{
                        position: "absolute", top: -22, right: 0,
                        background: HV.accent, color: HV.bg,
                        padding: "2px 8px", borderRadius: 4,
                        fontFamily: HV.fontMono, fontSize: 9, fontWeight: 600,
                        whiteSpace: "nowrap",
                        opacity: copyT > 0.85 ? 1 - (copyT - 0.85) / 0.15 : 1,
                      }}>
                        COPIED ✓
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{
        flex: 1,
        display: "flex", flexDirection: "column", justifyContent: "center",
        gap: 32,
      }}>
        <div style={{
          fontFamily: HV.fontMono, fontSize: 14, color: HV.accent,
          letterSpacing: "0.18em", textTransform: "uppercase",
        }}>02 — Vault</div>
        <div style={{
          fontFamily: HV.fontDisplay, fontSize: 64, fontWeight: 600,
          color: HV.text, letterSpacing: "-0.03em", lineHeight: 1.05,
        }}>
          Your keys.<br/>
          <span style={{ color: HV.accent }}>Your machine.</span><br/>
          <span style={{ color: HV.text3 }}>Nowhere else.</span>
        </div>
        <div style={{
          fontFamily: HV.fontSans, fontSize: 18, color: HV.text2,
          lineHeight: 1.5, maxWidth: 420,
        }}>
          API tokens live in your browser&apos;s localStorage. No backend. No telemetry. No &quot;we promise we don&apos;t read them.&quot;
        </div>

        <div style={{
          display: "inline-flex", alignItems: "center", gap: 10,
          padding: "14px 18px",
          background: HV.accentDim,
          border: `1px solid ${HV.accent}`,
          borderRadius: 999,
          width: "fit-content",
          opacity: lockOpacity,
        }}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke={HV.accent} strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          <span style={{ fontFamily: HV.fontMono, fontSize: 12, color: HV.accent, letterSpacing: "0.1em", fontWeight: 500 }}>
            ENCRYPTED · LOCAL · YOURS
          </span>
        </div>
      </div>
    </div>
  );
}

// SCENE 5 — launch + GitHub drawer (24-32s)
function LaunchScene() {
  const { localTime } = useSprite();

  const chromeT = Easing.easeOutCubic(clamp(localTime / 0.5, 0, 1));

  const railTools = [HEROES[1], HEROES[0], HEROES[2], HEROES[3], HEROES[4], HEROES[5], HEROES[8]];

  const hoverIdx = 0;
  const hoverT = clamp((localTime - 2.5) / 0.4, 0, 1) * (localTime < 4.6 ? 1 : 0);

  const clickFlashT = (() => {
    const start = 4.4;
    if (localTime < start) return 0;
    return clamp(1 - (localTime - start) / 0.5, 0, 1);
  })();

  const drawerT = Easing.easeOutCubic(clamp((localTime - 4.9) / 0.7, 0, 1));

  const REPOS = [
    { name: "hangar", desc: "Your stack, in one screen", stars: 1284, lang: "TypeScript", langC: "#3178c6", updated: "2m ago" },
    { name: "next-saas-template", desc: "Opinionated Next.js starter", stars: 482, lang: "TypeScript", langC: "#3178c6", updated: "1h ago" },
    { name: "edge-cron", desc: "Cron jobs at the edge", stars: 219, lang: "TypeScript", langC: "#3178c6", updated: "3h ago" },
    { name: "react-keyvault", desc: "localStorage with hooks", stars: 87, lang: "JavaScript", langC: "#f7df1e", updated: "yesterday" },
  ];

  return (
    <div style={{
      position: "absolute", inset: 0,
      background: HV.bg,
      opacity: chromeT,
    }}>
      <div style={{
        position: "absolute", top: 60, left: 60, right: 60,
        background: HV.panel,
        border: `1px solid ${HV.line}`,
        borderRadius: 12,
        padding: "14px 20px",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{
          fontFamily: HV.fontMono, fontSize: 10, color: HV.text3,
          textTransform: "uppercase", letterSpacing: "0.18em", marginRight: 8,
        }}>QUICK LAUNCH</div>
        {railTools.map((t, i) => {
          const tT = Easing.easeOutBack(clamp((localTime - 0.4 - i * 0.08) / 0.5, 0, 1));
          const isHovered = i === hoverIdx && hoverT > 0.5;
          return (
            <div key={t.id} style={{
              padding: 10,
              border: `1px solid ${isHovered ? HV.accent : HV.line}`,
              borderRadius: 8,
              background: isHovered ? HV.accentDim : HV.bg,
              opacity: tT,
              transform: `translateY(${(1 - tT) * 12}px) scale(${tT})`,
              position: "relative",
            }}>
              <ToolTile tool={t} size={36} radius={6} />
              {isHovered && (
                <div style={{
                  position: "absolute", top: -34, left: "50%", transform: "translateX(-50%)",
                  background: HV.text, color: HV.bg,
                  padding: "4px 10px", borderRadius: 6,
                  fontFamily: HV.fontSans, fontSize: 11, fontWeight: 600,
                  whiteSpace: "nowrap",
                }}>
                  Open {t.name} ↗
                </div>
              )}
            </div>
          );
        })}
        <div style={{ flex: 1 }} />
        <div style={{
          fontFamily: HV.fontMono, fontSize: 11, color: HV.accent,
        }}>{railTools.length} pinned · ⌘K</div>
      </div>

      {clickFlashT > 0 && (
        <div style={{
          position: "absolute",
          top: 60 + 24, left: 60 + 168,
          width: 80, height: 80,
          borderRadius: "50%",
          border: `3px solid ${HV.accent}`,
          opacity: clickFlashT * 0.7,
          transform: `translate(-50%, -50%) scale(${1 + (1 - clickFlashT) * 1.5})`,
          pointerEvents: "none",
        }} />
      )}

      <div style={{
        position: "absolute",
        right: 60, top: 160,
        width: 700,
        background: HV.panel,
        border: `1px solid ${HV.line}`,
        borderRadius: 14,
        padding: 32,
        opacity: drawerT,
        transform: `translateX(${(1 - drawerT) * 60}px)`,
        boxShadow: `0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px ${HV.accent}33`,
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 14,
          paddingBottom: 18,
          borderBottom: `1px solid ${HV.line}`,
        }}>
          <ToolTile tool={HEROES[1]} size={48} radius={8} />
          <div>
            <div style={{ fontFamily: HV.fontDisplay, fontSize: 22, fontWeight: 600, color: HV.text }}>
              GitHub <span style={{ color: HV.text3, fontSize: 14, fontWeight: 400 }}>· @claudevguy</span>
            </div>
            <div style={{ fontFamily: HV.fontMono, fontSize: 11, color: HV.accent, marginTop: 4, letterSpacing: "0.1em" }}>
              ● LIVE · using your PAT
            </div>
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <div style={{
            fontFamily: HV.fontMono, fontSize: 10, color: HV.text3,
            textTransform: "uppercase", letterSpacing: "0.16em", marginBottom: 12,
          }}>Recently pushed</div>
          {REPOS.map((r, i) => {
            const rStart = 5.4 + i * 0.18;
            const rT = clamp((localTime - rStart) / 0.4, 0, 1);
            return (
              <div key={r.name} style={{
                padding: "12px 14px",
                background: HV.bg2,
                border: `1px solid ${HV.line}`,
                borderRadius: 8,
                marginBottom: 8,
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 12,
                opacity: rT,
                transform: `translateY(${(1 - rT) * 10}px)`,
              }}>
                <div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <div style={{ fontFamily: HV.fontSans, fontSize: 14, fontWeight: 600, color: HV.text }}>
                      {r.name}
                    </div>
                    <div style={{ fontFamily: HV.fontMono, fontSize: 10, color: HV.text3 }}>{r.updated}</div>
                  </div>
                  <div style={{ fontFamily: HV.fontSans, fontSize: 12, color: HV.text2, marginTop: 4 }}>
                    {r.desc}
                  </div>
                </div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 12,
                  fontFamily: HV.fontMono, fontSize: 11, color: HV.text3,
                }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: r.langC, display: "inline-block" }} />
                    {r.lang}
                  </span>
                  <span>★ {r.stars.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{
        position: "absolute",
        left: 60, top: 220,
        width: 480,
      }}>
        <div style={{
          fontFamily: HV.fontMono, fontSize: 14, color: HV.accent,
          letterSpacing: "0.18em", textTransform: "uppercase",
          opacity: clamp((localTime - 1.6) / 0.5, 0, 1),
        }}>03 — Launch</div>
        <div style={{
          fontFamily: HV.fontDisplay, fontSize: 64, fontWeight: 600,
          color: HV.text, letterSpacing: "-0.03em", lineHeight: 1.05,
          marginTop: 14,
          opacity: clamp((localTime - 1.8) / 0.5, 0, 1),
        }}>
          One click.<br/>
          <span style={{ color: HV.text3 }}>Live data.</span>
        </div>
        <div style={{
          fontFamily: HV.fontSans, fontSize: 18, color: HV.text2,
          lineHeight: 1.5, marginTop: 24,
          opacity: clamp((localTime - 2.2) / 0.5, 0, 1),
        }}>
          Drop a GitHub PAT into the vault — your profile and recent pushes appear right inside Hangar.
        </div>

        <div style={{
          marginTop: 36,
          padding: "14px 18px",
          background: HV.bg2, border: `1px solid ${HV.line}`,
          borderRadius: 10,
          fontFamily: HV.fontMono, fontSize: 12, color: HV.text2,
          opacity: drawerT,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: "50%", background: HV.accent,
            boxShadow: `0 0 10px ${HV.accent}`,
          }} />
          GET https://api.github.com/user/repos · <span style={{ color: HV.accent }}>200 OK</span>
        </div>
      </div>
    </div>
  );
}

// SCENE 6 — theme switch (32-36s)
function ThemeScene() {
  const { localTime } = useSprite();

  const switched = localTime > 1.5;
  const theme = switched ? lightHV : HV;
  const wipeT = clamp((localTime - 1.4) / 0.6, 0, 1);

  const display = HEROES.slice(0, 8);

  return (
    <div style={{
      position: "absolute", inset: 0,
      background: theme.bg,
      transition: "background 0.4s",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", inset: 0,
        background: `linear-gradient(90deg, transparent ${wipeT * 100 - 8}%, ${HV.accent} ${wipeT * 100 - 4}%, ${HV.accent} ${wipeT * 100}%, transparent ${wipeT * 100 + 8}%)`,
        opacity: wipeT > 0 && wipeT < 1 ? 0.5 : 0,
      }} />

      <div style={{
        position: "absolute",
        left: 60, top: 60,
        fontFamily: HV.fontMono, fontSize: 14, color: theme.accent,
        letterSpacing: "0.18em", textTransform: "uppercase",
        transition: "color 0.4s",
      }}>04 — Yours, your way</div>

      <div style={{
        position: "absolute",
        left: 60, top: 120,
        fontFamily: HV.fontDisplay, fontSize: 88, fontWeight: 600,
        letterSpacing: "-0.04em", lineHeight: 1.0,
        color: theme.text,
        transition: "color 0.4s",
      }}>
        Dark. <span style={{ color: theme.text3 }}>Or light.</span>
      </div>

      <div style={{
        position: "absolute",
        left: 60, right: 60, bottom: 60,
        height: 460,
        background: theme.panel,
        border: `1px solid ${theme.line}`,
        borderRadius: 16,
        padding: 28,
        transition: "background 0.4s, border-color 0.4s",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          paddingBottom: 16, borderBottom: `1px solid ${theme.line}`,
        }}>
          <div style={{
            fontFamily: HV.fontDisplay, fontSize: 18, fontWeight: 700, color: theme.text,
          }}>Hangar<span style={{ color: theme.accent }}>.</span></div>
          <div style={{ flex: 1 }} />
          <div style={{
            display: "flex", background: theme.bg2,
            border: `1px solid ${theme.line}`, borderRadius: 999,
            padding: 3, gap: 2,
          }}>
            <div style={{
              padding: "6px 16px", borderRadius: 999,
              fontFamily: HV.fontMono, fontSize: 11,
              background: !switched ? theme.text : "transparent",
              color: !switched ? theme.bg : theme.text3,
              transition: "all 0.3s",
            }}>DARK</div>
            <div style={{
              padding: "6px 16px", borderRadius: 999,
              fontFamily: HV.fontMono, fontSize: 11,
              background: switched ? theme.text : "transparent",
              color: switched ? theme.bg : theme.text3,
              transition: "all 0.3s",
            }}>LIGHT</div>
          </div>
        </div>

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(8, 1fr)",
          gap: 16, marginTop: 28, flex: 1,
        }}>
          {display.map((t) => (
            <div key={t.id} style={{
              padding: 18,
              background: theme.bg,
              border: `1px solid ${theme.line}`,
              borderRadius: 10,
              display: "flex", flexDirection: "column", gap: 12,
              transition: "background 0.4s, border-color 0.4s",
            }}>
              <ToolTile tool={t} size={42} radius={7} />
              <div style={{
                fontFamily: HV.fontSans, fontSize: 13, fontWeight: 600,
                color: theme.text, transition: "color 0.4s",
              }}>{t.name}</div>
              <div style={{
                fontFamily: HV.fontMono, fontSize: 9, color: theme.accent,
                textTransform: "uppercase", letterSpacing: "0.14em",
                transition: "color 0.4s",
              }}>● LIVE</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// SCENE 7 — end card (36-40s)
function EndScene() {
  const { localTime } = useSprite();

  const t1 = Easing.easeOutCubic(clamp(localTime / 0.6, 0, 1));
  const t2 = clamp((localTime - 0.5) / 0.5, 0, 1);
  const t3 = clamp((localTime - 1.0) / 0.5, 0, 1);
  const t4 = clamp((localTime - 1.6) / 0.5, 0, 1);

  return (
    <div style={{
      position: "absolute", inset: 0,
      background: HV.bg,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        position: "absolute",
        width: 1200, height: 1200,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${HV.accent} 0%, transparent 60%)`,
        opacity: 0.08 * t1,
        filter: "blur(120px)",
      }} />

      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `linear-gradient(${HV.line} 1px, transparent 1px), linear-gradient(90deg, ${HV.line} 1px, transparent 1px)`,
        backgroundSize: "64px 64px",
        opacity: 0.3,
        maskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)",
      }} />

      <div style={{
        fontFamily: HV.fontDisplay, fontSize: 240, fontWeight: 700,
        letterSpacing: "-0.05em", color: HV.text,
        opacity: t1, transform: `scale(${0.94 + 0.06 * t1})`,
        position: "relative", lineHeight: 1,
      }}>
        Hangar<span style={{ color: HV.accent }}>.</span>
      </div>

      <div style={{
        fontFamily: HV.fontDisplay, fontSize: 36, fontWeight: 500,
        color: HV.text2, marginTop: 20,
        opacity: t2,
        transform: `translateY(${(1 - t2) * 14}px)`,
        letterSpacing: "-0.01em",
      }}>
        Your stack. <span style={{ color: HV.text }}>One screen.</span>
      </div>

      <div style={{
        marginTop: 56,
        padding: "18px 36px",
        background: HV.accent, color: HV.bg,
        borderRadius: 999,
        fontFamily: HV.fontSans, fontSize: 18, fontWeight: 600,
        opacity: t3,
        transform: `translateY(${(1 - t3) * 14}px) scale(${0.94 + 0.06 * t3})`,
        boxShadow: `0 0 60px ${HV.accent}66`,
      }}>
        Open Hangar →
      </div>

      <div style={{
        marginTop: 24,
        fontFamily: HV.fontMono, fontSize: 13, color: HV.text3,
        letterSpacing: "0.14em", textTransform: "uppercase",
        opacity: t4,
      }}>
        hangar.dev · open source · MIT
      </div>
    </div>
  );
}

export function HangarShowcase() {
  return (
    <>
      <Sprite start={0} end={4}><ChaosScene /></Sprite>
      <Sprite start={4} end={8}><WordmarkScene /></Sprite>
      <Sprite start={8} end={16}><PinScene /></Sprite>
      <Sprite start={16} end={24}><VaultScene /></Sprite>
      <Sprite start={24} end={32}><LaunchScene /></Sprite>
      <Sprite start={32} end={36}><ThemeScene /></Sprite>
      <Sprite start={36} end={40}><EndScene /></Sprite>
    </>
  );
}
