import type { ActivityItem, Category, Tool } from "../types";

// Tool catalog — real dev tools, real logos (SVG inline), real account URLs.
// Each tool: id, name, category, tagline, color (brand-ish), logo (SVG string),
// accountUrl, docs, pricing, optional plan + status.
export const TOOLS: Tool[] = [
  // HOSTING & DEPLOYMENT
  {
    id: "vercel", name: "Vercel", category: "Hosting", tagline: "Frontend cloud for Next.js & friends",
    color: "#ffffff", bg: "#000000",
    accountUrl: "https://vercel.com/dashboard", docs: "https://vercel.com/docs",
    pricing: "Free · Pro $20/mo · Enterprise",    logo: `<svg viewBox="0 0 76 65" fill="currentColor"><path d="M37.59.25l36.95 64H.64l36.95-64z"/></svg>`,
  },
  {
    id: "netlify", name: "Netlify", category: "Hosting", tagline: "Build, deploy & scale modern web",
    color: "#00C7B7", bg: "#0E1E25",
    accountUrl: "https://app.netlify.com", docs: "https://docs.netlify.com",
    pricing: "Free · Pro $19/mo · Business $99/mo",
    logo: `<svg viewBox="0 0 256 226" fill="currentColor"><path d="M52 161h-2l-12-13v-3l21-21 7 1 1 7-15 16zm-12-39v-3l-9-10h-2L0 134v8l8 8 4 1zm78-89l-7 1-37 37v3l9 10h3l43-43-1-7-7-1zm91 81l-9-9h-3l-7 7-43-43 1-7 25-25-9-10-1-7 5-1 16 16-1 7zM73 84l30 30-30 30-29-29zm38 38l30 30-30 30-29-29zm38-38l30 30-30 30-29-29zm38 38l30 30-30 30-29-29z"/></svg>`,
  },
  {
    id: "fly", name: "Fly.io", category: "Hosting", tagline: "Run apps close to users worldwide",
    color: "#8B5CF6", bg: "#1A1133",
    accountUrl: "https://fly.io/dashboard", docs: "https://fly.io/docs",
    pricing: "Pay-as-you-go · ~$2/mo small VM",
    logo: `<svg viewBox="0 0 100 100" fill="currentColor"><path d="M25 20h50c8 0 15 7 15 15v30c0 8-7 15-15 15H25c-8 0-15-7-15-15V35c0-8 7-15 15-15zm5 25l15 20 25-30-15-3z"/></svg>`,
  },
  {
    id: "cloudflare", name: "Cloudflare", category: "Hosting", tagline: "Edge network, Workers, R2",
    color: "#F38020", bg: "#1A0F00",
    accountUrl: "https://dash.cloudflare.com", docs: "https://developers.cloudflare.com",
    pricing: "Free · Workers Paid $5/mo",    logo: `<svg viewBox="0 0 100 60" fill="currentColor"><path d="M75 30c-1 0-3 0-4 1-2-9-10-16-19-16-8 0-15 5-18 13-1-1-3-1-4-1-7 0-13 6-13 13s6 13 13 13h45c5 0 10-4 10-9s-5-14-10-14z"/></svg>`,
  },

  // DATABASES
  {
    id: "neon", name: "Neon", category: "Database", tagline: "Serverless Postgres with branching",
    color: "#00E599", bg: "#001A0D",
    accountUrl: "https://console.neon.tech", docs: "https://neon.tech/docs",
    pricing: "Free · Launch $19/mo · Scale $69/mo",    logo: `<svg viewBox="0 0 100 100" fill="currentColor"><path d="M10 25c0-8 7-15 15-15h50c8 0 15 7 15 15v40L60 30v40H25c-8 0-15-7-15-15V25z"/></svg>`,
  },
  {
    id: "supabase", name: "Supabase", category: "Database", tagline: "Postgres + auth + storage + edge",
    color: "#3ECF8E", bg: "#0F1F17",
    accountUrl: "https://supabase.com/dashboard", docs: "https://supabase.com/docs",
    pricing: "Free · Pro $25/mo · Team $599/mo",
    logo: `<svg viewBox="0 0 109 113" fill="currentColor"><path d="M63 110c-3 4-9 1-9-3l-1-44h60c11 0 17 13 10 21l-60 26zM45 4c3-4 9-1 9 3l1 44H-5c-11 0-17-13-10-21L45 4z"/></svg>`,
  },
  {
    id: "planetscale", name: "PlanetScale", category: "Database", tagline: "MySQL at scale, branchable",
    color: "#F8F8F8", bg: "#000000",
    accountUrl: "https://app.planetscale.com", docs: "https://planetscale.com/docs",
    pricing: "Scaler $39/mo · Enterprise",
    logo: `<svg viewBox="0 0 100 100" fill="currentColor"><circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" stroke-width="6"/><path d="M50 2v96M2 50h96M15 15l70 70M85 15L15 85" stroke="currentColor" stroke-width="3" fill="none"/></svg>`,
  },
  {
    id: "mongodb", name: "MongoDB Atlas", category: "Database", tagline: "Document database, fully managed",
    color: "#47A248", bg: "#0E1F0F",
    accountUrl: "https://cloud.mongodb.com", docs: "https://www.mongodb.com/docs",
    pricing: "Free M0 · Dedicated from $57/mo",
    logo: `<svg viewBox="0 0 100 100" fill="currentColor"><path d="M50 5c-3 12-15 25-15 50 0 20 10 35 15 40 5-5 15-20 15-40 0-25-12-38-15-50z"/></svg>`,
  },

  // AUTH
  {
    id: "clerk", name: "Clerk", category: "Auth", tagline: "Drop-in user management",
    color: "#6C47FF", bg: "#0E0820",
    accountUrl: "https://dashboard.clerk.com", docs: "https://clerk.com/docs",
    pricing: "Free up to 10k MAU · Pro $25/mo",    logo: `<svg viewBox="0 0 100 100" fill="currentColor"><circle cx="50" cy="40" r="15"/><path d="M20 80c5-15 17-22 30-22s25 7 30 22M30 70l8 8M70 70l-8 8"/></svg>`,
  },
  {
    id: "auth0", name: "Auth0", category: "Auth", tagline: "Identity platform for builders",
    color: "#EB5424", bg: "#1F0E07",
    accountUrl: "https://manage.auth0.com", docs: "https://auth0.com/docs",
    pricing: "Free · Essentials $35/mo · Pro $240/mo",
    logo: `<svg viewBox="0 0 100 100" fill="currentColor"><path d="M50 5L85 30v25L50 95 15 55V30z"/></svg>`,
  },
  {
    id: "workos", name: "WorkOS", category: "Auth", tagline: "Enterprise SSO, SCIM, audit logs",
    color: "#6363F1", bg: "#0E0E26",
    accountUrl: "https://dashboard.workos.com", docs: "https://workos.com/docs",
    pricing: "Free up to 1M MAU · Usage based",
    logo: `<svg viewBox="0 0 100 30" fill="currentColor"><text x="0" y="22" font-family="monospace" font-weight="900" font-size="22">W○S</text></svg>`,
  },

  // CODE & REPOS
  {
    id: "github", name: "GitHub", category: "Code", tagline: "Where the world builds software",
    color: "#FFFFFF", bg: "#0D1117",
    accountUrl: "https://github.com", docs: "https://docs.github.com",
    pricing: "Free · Team $4/mo · Enterprise $21/mo",    logo: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .3a12 12 0 00-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.3-3.1-.2-.4-.6-1.6 0-3.2 0 0 1-.3 3.4 1.2a11.5 11.5 0 016 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.6.2 2.8.1 3.2.7.8 1.3 1.9 1.3 3.1 0 4.6-2.8 5.6-5.5 5.9.5.4.9 1.2.9 2.4v3.5c0 .3.1.7.8.6A12 12 0 0012 .3z"/></svg>`,
  },
  {
    id: "gitlab", name: "GitLab", category: "Code", tagline: "DevSecOps platform",
    color: "#FC6D26", bg: "#1F0F00",
    accountUrl: "https://gitlab.com", docs: "https://docs.gitlab.com",
    pricing: "Free · Premium $29/user · Ultimate $99/user",
    logo: `<svg viewBox="0 0 100 100" fill="currentColor"><path d="M50 90L20 45h60zM50 90L20 45 5 60zM50 90l30-45 15 15zM20 45L10 15l10 30zM80 45l10-30-10 30z"/></svg>`,
  },
  {
    id: "linear", name: "Linear", category: "Code", tagline: "Issue tracking that's fast",
    color: "#5E6AD2", bg: "#0E1126",
    accountUrl: "https://linear.app", docs: "https://linear.app/docs",
    pricing: "Free · Standard $8/user · Plus $14/user",    logo: `<svg viewBox="0 0 100 100" fill="currentColor"><path d="M5 60c0-30 25-55 55-55 19 0 35 9 45 24L29 95C16 87 7 75 5 60zM10 75l60 15c-20 5-45 0-60-15zM35 5L95 65c0-10-2-19-7-27L40 5h-5z"/></svg>`,
  },

  // BACKGROUND JOBS
  {
    id: "inngest", name: "Inngest", category: "Jobs", tagline: "Event-driven queues & workflows",
    color: "#52D0B6", bg: "#06181A",
    accountUrl: "https://app.inngest.com", docs: "https://www.inngest.com/docs",
    pricing: "Free · Pro $20/mo · Enterprise",
    logo: `<svg viewBox="0 0 100 100" fill="currentColor"><circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="50" cy="50" r="15"/></svg>`,
  },
  {
    id: "trigger", name: "Trigger.dev", category: "Jobs", tagline: "Long-running jobs, no timeouts",
    color: "#A78BFA", bg: "#160E26",
    accountUrl: "https://cloud.trigger.dev", docs: "https://trigger.dev/docs",
    pricing: "Free · Hobby $20/mo · Pro $50/mo",
    logo: `<svg viewBox="0 0 100 100" fill="currentColor"><path d="M50 5l45 80H5z"/></svg>`,
  },
  {
    id: "upstash", name: "Upstash", category: "Jobs", tagline: "Serverless Redis & Kafka & QStash",
    color: "#00E9A3", bg: "#001A12",
    accountUrl: "https://console.upstash.com", docs: "https://upstash.com/docs",
    pricing: "Free · Pay-per-request",
    logo: `<svg viewBox="0 0 100 100" fill="currentColor"><path d="M20 30c20 20 40 20 60 0M20 50c20 20 40 20 60 0M20 70c20 20 40 20 60 0" stroke="currentColor" stroke-width="8" fill="none"/></svg>`,
  },

  // MONITORING
  {
    id: "sentry", name: "Sentry", category: "Monitoring", tagline: "Error & performance monitoring",
    color: "#A737B4", bg: "#1A0820",
    accountUrl: "https://sentry.io", docs: "https://docs.sentry.io",
    pricing: "Free · Team $26/mo · Business $80/mo",    logo: `<svg viewBox="0 0 100 100" fill="currentColor"><path d="M50 15L20 80h20c0-15 5-30 30-40-3-5-10-15-20-25z"/><path d="M50 30c15 25 25 35 25 50H60c0-10-3-15-10-25l-5 5h-5l5-15h5z" opacity=".6"/></svg>`,
  },
  {
    id: "posthog", name: "PostHog", category: "Monitoring", tagline: "Product analytics, sessions, flags",
    color: "#F9BD2B", bg: "#1F1700",
    accountUrl: "https://app.posthog.com", docs: "https://posthog.com/docs",
    pricing: "Free 1M events · Pay-as-you-go",    logo: `<svg viewBox="0 0 100 100" fill="currentColor"><path d="M5 50L50 5v30l30-30v90H5V50z"/></svg>`,
  },
  {
    id: "datadog", name: "Datadog", category: "Monitoring", tagline: "Infra, APM, logs at scale",
    color: "#632CA6", bg: "#0E0620",
    accountUrl: "https://app.datadoghq.com", docs: "https://docs.datadoghq.com",
    pricing: "Pro $15/host · Enterprise $23/host",
    logo: `<svg viewBox="0 0 100 100" fill="currentColor"><path d="M85 25L60 60l-10-10-15 20-15-5L5 90h90zM75 15c0 5-5 10-10 10s-10-5-10-10 5-10 10-10 10 5 10 10z"/></svg>`,
  },

  // EMAIL
  {
    id: "resend", name: "Resend", category: "Email", tagline: "Email API for developers",
    color: "#FFFFFF", bg: "#000000",
    accountUrl: "https://resend.com", docs: "https://resend.com/docs",
    pricing: "Free 3k/mo · Pro $20/mo · Scale $90/mo",    logo: `<svg viewBox="0 0 100 100" fill="currentColor"><path d="M15 25h70v50H15z" fill="none" stroke="currentColor" stroke-width="6"/><path d="M15 25l35 30 35-30" fill="none" stroke="currentColor" stroke-width="6"/></svg>`,
  },
  {
    id: "postmark", name: "Postmark", category: "Email", tagline: "Transactional email that lands",
    color: "#FFE45F", bg: "#1F1A00",
    accountUrl: "https://account.postmarkapp.com", docs: "https://postmarkapp.com/developer",
    pricing: "Free 100/mo · $15/mo 10k emails",
    logo: `<svg viewBox="0 0 100 100" fill="currentColor"><path d="M50 10L90 30v40L50 90 10 70V30z" fill="none" stroke="currentColor" stroke-width="6"/><circle cx="50" cy="50" r="12"/></svg>`,
  },

  // PAYMENTS
  {
    id: "stripe", name: "Stripe", category: "Payments", tagline: "Payments infrastructure for the internet",
    color: "#635BFF", bg: "#0E0D26",
    accountUrl: "https://dashboard.stripe.com", docs: "https://stripe.com/docs",
    pricing: "2.9% + 30¢ per transaction",    logo: `<svg viewBox="0 0 60 25" fill="currentColor"><path d="M59 13c0-4-2-7-6-7-4 0-7 3-7 8 0 5 3 8 8 8 2 0 4-1 5-1v-3l-5 1c-2 0-3-1-3-3h8v-3zm-8-1c0-2 1-3 3-3 1 0 2 1 2 3h-5zM38 6c-2 0-3 1-4 2v-2h-4v23l4-1v-6c1 1 2 1 3 1 4 0 7-3 7-9 0-5-3-8-6-8zm-1 12c-1 0-2 0-3-1v-7c1-1 2-1 3-1 2 0 3 2 3 4 0 3-1 5-3 5zM23 4l-4 1v3h-2v3h2v8c0 3 2 4 4 4 1 0 2 0 3-1v-3l-2 1c-1 0-1 0-1-1v-8h3V8h-3V4zM12 6c-2 0-3 1-4 1V6H4v15h4v-9c1-1 3-2 4-1V6zM0 11c0-2 4-2 6-1l1-3-3-1c-3 0-6 2-6 5 0 5 7 4 7 6 0 1-1 1-3 1-2 0-4-1-4-1l-1 4c1 0 3 1 5 1 4 0 7-2 7-6 0-5-7-4-9-5z"/></svg>`,
  },
  {
    id: "lemonsqueezy", name: "Lemon Squeezy", category: "Payments", tagline: "Merchant of record for digital",
    color: "#FFC233", bg: "#1F1700",
    accountUrl: "https://app.lemonsqueezy.com", docs: "https://docs.lemonsqueezy.com",
    pricing: "5% + 50¢ per transaction",
    logo: `<svg viewBox="0 0 100 100" fill="currentColor"><ellipse cx="50" cy="50" rx="35" ry="40"/><path d="M50 10c-3 5-3 10 0 15M50 90c-3-5-3-10 0-15" stroke="currentColor" stroke-width="4" fill="none"/></svg>`,
  },

  // AI
  {
    id: "anthropic", name: "Anthropic", category: "AI", tagline: "Claude API — frontier models",
    color: "#D97757", bg: "#1F0E08",
    accountUrl: "https://console.anthropic.com", docs: "https://docs.anthropic.com",
    pricing: "Pay-per-token · Sonnet $3/$15 per Mtok",    logo: `<svg viewBox="0 0 100 100" fill="currentColor"><path d="M27 20h15l25 60H53l-5-13H30l-5 13H10zM39 30l-7 22h13z"/></svg>`,
  },
  {
    id: "openai", name: "OpenAI", category: "AI", tagline: "GPT, Whisper, embeddings, realtime",
    color: "#10A37F", bg: "#06180F",
    accountUrl: "https://platform.openai.com", docs: "https://platform.openai.com/docs",
    pricing: "Pay-per-token · GPT-4o $2.50/$10 per Mtok",
    logo: `<svg viewBox="0 0 100 100" fill="currentColor"><path d="M50 5a45 45 0 100 90 45 45 0 000-90zm0 15a30 30 0 11-30 30c0-3 1-6 2-9l13 8v15l15 8 15-8V49l13-8a30 30 0 01-28 9z"/></svg>`,
  },
  {
    id: "replicate", name: "Replicate", category: "AI", tagline: "Run open-source ML models via API",
    color: "#FFFFFF", bg: "#000000",
    accountUrl: "https://replicate.com", docs: "https://replicate.com/docs",
    pricing: "Pay-per-second · varies by model",
    logo: `<svg viewBox="0 0 100 100" fill="currentColor"><path d="M10 20h80v15H30v15h50v15H50v15H30V20H10z"/></svg>`,
  },

  // DESIGN & CMS
  {
    id: "figma", name: "Figma", category: "Design", tagline: "Collaborative design & prototyping",
    color: "#F24E1E", bg: "#1F0805",
    accountUrl: "https://figma.com", docs: "https://help.figma.com",
    pricing: "Free · Pro $15/editor · Org $45/editor",    logo: `<svg viewBox="0 0 38 57" fill="currentColor"><path d="M19 28a10 10 0 1119 0 10 10 0 01-19 0zM0 47a10 10 0 0110-10h9v19a10 10 0 01-19-9zM19 0v19h10a10 10 0 000-19h-10zM0 9a10 10 0 0010 10h9V0h-9A10 10 0 000 9zM0 28a10 10 0 0010 10h9V19h-9A10 10 0 000 28z"/></svg>`,
  },
  {
    id: "sanity", name: "Sanity", category: "Design", tagline: "Composable headless CMS",
    color: "#F03E2F", bg: "#1F0805",
    accountUrl: "https://sanity.io/manage", docs: "https://www.sanity.io/docs",
    pricing: "Free · Growth $99/mo · Enterprise",
    logo: `<svg viewBox="0 0 100 100" fill="currentColor"><path d="M30 20c0 10 8 15 25 18 20 4 35 12 35 30 0 13-10 22-25 22 0-12-8-18-25-22-22-5-35-13-35-30 0-13 11-23 25-23M40 95c-12-2-22-8-25-20h25v20zM60 5c12 2 22 8 25 20H60V5z"/></svg>`,
  },
];

export const CATEGORIES: Category[] = [
  { id: "all", name: "All tools", icon: "◉" },
  { id: "Hosting", name: "Hosting", icon: "▲" },
  { id: "Database", name: "Databases", icon: "◐" },
  { id: "Auth", name: "Auth", icon: "◇" },
  { id: "Code", name: "Code", icon: "◀" },
  { id: "Jobs", name: "Jobs & Queues", icon: "↻" },
  { id: "Monitoring", name: "Monitoring", icon: "◊" },
  { id: "Email", name: "Email", icon: "✉" },
  { id: "Payments", name: "Payments", icon: "$" },
  { id: "AI", name: "AI & ML", icon: "✦" },
  { id: "Design", name: "Design & CMS", icon: "◈" },
];

// Recent activity is sourced from connected integrations. Empty until
// per-tool integrations are wired up (GitHub is the first; see GitHubInsights).
export const ACTIVITY: ActivityItem[] = [];
