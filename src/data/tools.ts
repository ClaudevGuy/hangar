import type { ActivityItem, Category, Tool } from "../types";

// Tool catalog — real dev tools, real logos (SVG inline), real account URLs.
// Each tool: id, name, category, tagline, color (brand-ish), logo (SVG string),
// accountUrl, docs, pricing, optional plan + status.
//
// All logos are monochrome silhouettes using `currentColor` so they paint in
// the tool's `color` against the `bg` tile. Designed at viewBox 0 0 24 24
// (or close) for visual consistency across the catalog. Rendered at 60% of
// the tile size by `.tool-logo svg` in styles.css.
export const TOOLS: Tool[] = [
  // HOSTING & DEPLOYMENT
  {
    id: "vercel", name: "Vercel", category: "Hosting", tagline: "Frontend cloud for Next.js & friends",
    color: "#ffffff", bg: "#000000",
    accountUrl: "https://vercel.com/dashboard", docs: "https://vercel.com/docs",
    pricing: "Free · Pro $20/mo · Enterprise",
    logo: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 24 22H0z"/></svg>`,
  },
  {
    id: "netlify", name: "Netlify", category: "Hosting", tagline: "Build, deploy & scale modern web",
    color: "#00C7B7", bg: "#0E1E25",
    accountUrl: "https://app.netlify.com", docs: "https://docs.netlify.com",
    pricing: "Free · Pro $19/mo · Business $99/mo",
    logo: `<svg viewBox="0 0 24 24" fill="currentColor" fill-rule="evenodd"><path d="M12 2 22 12l-10 10L2 12 12 2zm0 4.5L6.5 12 12 17.5 17.5 12 12 6.5zm0 2.5L9 12l3 3 3-3-3-3z"/></svg>`,
  },
  {
    id: "fly", name: "Fly.io", category: "Hosting", tagline: "Run apps close to users worldwide",
    color: "#8B5CF6", bg: "#1A1133",
    accountUrl: "https://fly.io/dashboard", docs: "https://fly.io/docs",
    pricing: "Pay-as-you-go · ~$2/mo small VM",
    logo: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C7.5 2 4 6 4 11c0 4 3 7 6 9l-1 2h6l-1-2c3-2 6-5 6-9 0-5-3.5-9-8-9zm0 4a4 4 0 110 8 4 4 0 010-8z" fill-rule="evenodd"/></svg>`,
  },
  {
    id: "cloudflare", name: "Cloudflare", category: "Hosting", tagline: "Edge network, Workers, R2",
    color: "#F38020", bg: "#1A0F00",
    accountUrl: "https://dash.cloudflare.com", docs: "https://developers.cloudflare.com",
    pricing: "Free · Workers Paid $5/mo",
    logo: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.5 11.2c-.4 0-.8.1-1.2.2-.7-2.6-3-4.4-5.8-4.4-2.5 0-4.7 1.6-5.5 3.9-.4-.2-.8-.3-1.3-.3-1.7 0-3 1.3-3 3 0 .3 0 .5.1.8C1.2 14.7.5 15.6.5 16.7c0 1.5 1.2 2.8 2.8 2.8h15.4c1.9 0 3.5-1.6 3.5-3.5s-1.7-4.8-3.7-4.8z"/></svg>`,
  },

  // DATABASES
  {
    id: "neon", name: "Neon", category: "Database", tagline: "Serverless Postgres with branching",
    color: "#00E599", bg: "#001A0D",
    accountUrl: "https://console.neon.tech", docs: "https://neon.tech/docs",
    pricing: "Free · Launch $19/mo · Scale $69/mo",
    logo: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 5a2 2 0 012-2h14a2 2 0 012 2v11l-4-4V5h-2v9l-4-4V5H7v14H5a2 2 0 01-2-2V5z"/></svg>`,
  },
  {
    id: "supabase", name: "Supabase", category: "Database", tagline: "Postgres + auth + storage + edge",
    color: "#3ECF8E", bg: "#0F1F17",
    accountUrl: "https://supabase.com/dashboard", docs: "https://supabase.com/docs",
    pricing: "Free · Pro $25/mo · Team $599/mo",
    logo: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2v9h7.5c.9 0 1.4 1 .9 1.7L11 23v-9H3.6c-.9 0-1.4-1-.9-1.7L13 2z"/></svg>`,
  },
  {
    id: "planetscale", name: "PlanetScale", category: "Database", tagline: "MySQL at scale, branchable",
    color: "#F8F8F8", bg: "#000000",
    accountUrl: "https://app.planetscale.com", docs: "https://planetscale.com/docs",
    pricing: "Scaler $39/mo · Enterprise",
    logo: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 12C2 6.5 6.5 2 12 2c4.5 0 8.3 2.9 9.7 7L8.4 22.3a10 10 0 01-4.4-3.5L13 9.5h-3.5L2.4 16.5A10 10 0 012 12zm10.7 9.9A10 10 0 0021.7 13L13 21.7l-.3.2z" fill-rule="evenodd"/></svg>`,
  },
  {
    id: "mongodb", name: "MongoDB Atlas", category: "Database", tagline: "Document database, fully managed",
    color: "#47A248", bg: "#0E1F0F",
    accountUrl: "https://cloud.mongodb.com", docs: "https://www.mongodb.com/docs",
    pricing: "Free M0 · Dedicated from $57/mo",
    logo: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1.5c-.5 1.6-1.6 3-2.4 4.5C7 9.4 6 12.4 6.6 16c.5 3 2.6 5.5 4.6 6.5h.4c.2-1.5.1-3 .3-4.4.1-.6 0-9 .1-9 0-2 0-5-.1-7.6z" fill-rule="evenodd"/></svg>`,
  },

  // AUTH
  {
    id: "clerk", name: "Clerk", category: "Auth", tagline: "Drop-in user management",
    color: "#6C47FF", bg: "#0E0820",
    accountUrl: "https://dashboard.clerk.com", docs: "https://clerk.com/docs",
    pricing: "Free up to 10k MAU · Pro $25/mo",
    logo: `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="3.5"/><path d="M19.5 4.5l-3 3a7 7 0 010 9l3 3a11 11 0 000-15zM4.5 4.5a11 11 0 000 15l3-3a7 7 0 010-9l-3-3zM7.5 19.5a11 11 0 009 0l-3-3a7 7 0 01-3 0l-3 3z"/></svg>`,
  },
  {
    id: "auth0", name: "Auth0", category: "Auth", tagline: "Identity platform for builders",
    color: "#EB5424", bg: "#1F0E07",
    accountUrl: "https://manage.auth0.com", docs: "https://auth0.com/docs",
    pricing: "Free · Essentials $35/mo · Pro $240/mo",
    logo: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.98 7.45L19.62 0H4.38L2.02 7.45c-1.35 4.31.03 9.2 3.81 12.01L12 24l6.16-4.54c3.79-2.81 5.17-7.7 3.82-12.01zM12 19.83l-4.99-3.7c-1.8-1.31-2.58-3.64-1.95-5.84l1.91-5.99h10.07l1.91 5.99c.63 2.21-.16 4.53-1.95 5.84L12 19.83z" fill-rule="evenodd"/></svg>`,
  },
  {
    id: "workos", name: "WorkOS", category: "Auth", tagline: "Enterprise SSO, SCIM, audit logs",
    color: "#6363F1", bg: "#0E0E26",
    accountUrl: "https://dashboard.workos.com", docs: "https://workos.com/docs",
    pricing: "Free up to 1M MAU · Usage based",
    logo: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 6h3l1.5 9L9 6h2l2.5 9L15 6h3l-3 13h-3L10 9.5 8 19H5L2 6z"/><circle cx="20.5" cy="12" r="2.5"/></svg>`,
  },

  // CODE & REPOS
  {
    id: "github", name: "GitHub", category: "Code", tagline: "Where the world builds software",
    color: "#FFFFFF", bg: "#0D1117",
    accountUrl: "https://github.com", docs: "https://docs.github.com",
    pricing: "Free · Team $4/mo · Enterprise $21/mo",
    logo: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .3a12 12 0 00-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.3-3.1-.2-.4-.6-1.6 0-3.2 0 0 1-.3 3.4 1.2a11.5 11.5 0 016 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.6.2 2.8.1 3.2.7.8 1.3 1.9 1.3 3.1 0 4.6-2.8 5.6-5.5 5.9.5.4.9 1.2.9 2.4v3.5c0 .3.1.7.8.6A12 12 0 0012 .3z"/></svg>`,
  },
  {
    id: "gitlab", name: "GitLab", category: "Code", tagline: "DevSecOps platform",
    color: "#FC6D26", bg: "#1F0F00",
    accountUrl: "https://gitlab.com", docs: "https://docs.gitlab.com",
    pricing: "Free · Premium $29/user · Ultimate $99/user",
    logo: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 22 3 14l1.5-4.5L7 16zm0 0 9-8-1.5-4.5L17 16zM3 14l-1-4.5 2.5-7L7 16zm18 0 1-4.5-2.5-7L17 16zm-9 8L7 16h10z"/></svg>`,
  },
  {
    id: "linear", name: "Linear", category: "Code", tagline: "Issue tracking that's fast",
    color: "#5E6AD2", bg: "#0E1126",
    accountUrl: "https://linear.app", docs: "https://linear.app/docs",
    pricing: "Free · Standard $8/user · Plus $14/user",
    logo: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.5 13 11 21.5A9.5 9.5 0 012.5 13zm0-3 11.5 11.5A10 10 0 011.7 9.7zM3.4 7l13.6 13.6a10 10 0 01-14.5-14.5zm1.7-2.5L19.5 19A10 10 0 014.6 4zM7.7 2.6a10 10 0 0113.7 13.7L7.7 2.6z"/></svg>`,
  },

  // BACKGROUND JOBS
  {
    id: "inngest", name: "Inngest", category: "Jobs", tagline: "Event-driven queues & workflows",
    color: "#52D0B6", bg: "#06181A",
    accountUrl: "https://app.inngest.com", docs: "https://www.inngest.com/docs",
    pricing: "Free · Pro $20/mo · Enterprise",
    logo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9.5"/><circle cx="12" cy="12" r="3.5" fill="currentColor"/></svg>`,
  },
  {
    id: "trigger", name: "Trigger.dev", category: "Jobs", tagline: "Long-running jobs, no timeouts",
    color: "#A78BFA", bg: "#160E26",
    accountUrl: "https://cloud.trigger.dev", docs: "https://trigger.dev/docs",
    pricing: "Free · Hobby $20/mo · Pro $50/mo",
    logo: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3 22 21H2zm0 5L7.5 19h9z" fill-rule="evenodd"/></svg>`,
  },
  {
    id: "upstash", name: "Upstash", category: "Jobs", tagline: "Serverless Redis & Kafka & QStash",
    color: "#00E9A3", bg: "#001A12",
    accountUrl: "https://console.upstash.com", docs: "https://upstash.com/docs",
    pricing: "Free · Pay-per-request",
    logo: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 4h2.5v16H5zm5.5 0H13v16h-2.5zm5.5 0h2.5v16H16z"/></svg>`,
  },

  // MONITORING
  {
    id: "sentry", name: "Sentry", category: "Monitoring", tagline: "Error & performance monitoring",
    color: "#A737B4", bg: "#1A0820",
    accountUrl: "https://sentry.io", docs: "https://docs.sentry.io",
    pricing: "Free · Team $26/mo · Business $80/mo",
    logo: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5c-.6 0-1.2.3-1.5.9L1.7 19a1.7 1.7 0 001.5 2.6h5.6a8 8 0 00-.05-1.5H3.7L12 6.5l3.1 5.4a13.5 13.5 0 015.1 11.2h-2.2a11.4 11.4 0 00-3.9-8.6l-2.2 3.8a6.9 6.9 0 012 4.8h2.4a13 13 0 01.7 3.2c0 .2 0 .4-.1.6h6.8c1.3 0 2.1-1.2 1.4-2.3L13.5 3.4A1.7 1.7 0 0012 2.5z"/></svg>`,
  },
  {
    id: "posthog", name: "PostHog", category: "Monitoring", tagline: "Product analytics, sessions, flags",
    color: "#F9BD2B", bg: "#1F1700",
    accountUrl: "https://app.posthog.com", docs: "https://posthog.com/docs",
    pricing: "Free 1M events · Pay-as-you-go",
    logo: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 18l4 4H2v-4zm0-5 9 9H7L2 17v-4zm0-5 14 14h-4L2 12V8zm0-5 19 19h-4L2 7V3zm5 0 14 14v-4L11 3H7zm5 0 9 9V8L16 3h-4z"/></svg>`,
  },
  {
    id: "datadog", name: "Datadog", category: "Monitoring", tagline: "Infra, APM, logs at scale",
    color: "#632CA6", bg: "#0E0620",
    accountUrl: "https://app.datadoghq.com", docs: "https://docs.datadoghq.com",
    pricing: "Pro $15/host · Enterprise $23/host",
    logo: `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="6" cy="9" r="2"/><circle cx="18" cy="9" r="2"/><circle cx="9" cy="4.5" r="1.7"/><circle cx="15" cy="4.5" r="1.7"/><path d="M12 10c-2.8 0-5 2.5-5 5.5 0 2 1 3.5 2.5 4l2.5-.5 2.5.5c1.5-.5 2.5-2 2.5-4 0-3-2.2-5.5-5-5.5z"/></svg>`,
  },

  // EMAIL
  {
    id: "resend", name: "Resend", category: "Email", tagline: "Email API for developers",
    color: "#FFFFFF", bg: "#000000",
    accountUrl: "https://resend.com", docs: "https://resend.com/docs",
    pricing: "Free 3k/mo · Pro $20/mo · Scale $90/mo",
    logo: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 3h7.5c3 0 5 1.7 5 4.5 0 2-1 3.4-2.7 4.2L19 21h-4.5l-3.7-8H9v8H5V3zm4 3.5v3.5h3c1.2 0 2-.6 2-1.7 0-1.2-.8-1.8-2-1.8H9z" fill-rule="evenodd"/></svg>`,
  },
  {
    id: "postmark", name: "Postmark", category: "Email", tagline: "Transactional email that lands",
    color: "#FFE45F", bg: "#1F1A00",
    accountUrl: "https://account.postmarkapp.com", docs: "https://postmarkapp.com/developer",
    pricing: "Free 100/mo · $15/mo 10k emails",
    logo: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 6.5C3 5.7 3.7 5 4.5 5h15c.8 0 1.5.7 1.5 1.5V8L12 14 3 8V6.5zm0 4 9 6 9-6V18c0 .8-.7 1.5-1.5 1.5h-15A1.5 1.5 0 013 18v-7.5z"/></svg>`,
  },

  // PAYMENTS
  {
    id: "stripe", name: "Stripe", category: "Payments", tagline: "Payments infrastructure for the internet",
    color: "#635BFF", bg: "#0E0D26",
    accountUrl: "https://dashboard.stripe.com", docs: "https://stripe.com/docs",
    pricing: "2.9% + 30¢ per transaction",
    logo: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 9.7c-2-.7-3-1.2-3-2 0-.7.6-1.1 1.6-1.1 1.8 0 3.6.7 4.9 1.4l.7-4.5C16.7 2.9 14.7 2.3 12 2.3c-2 0-3.7.5-4.9 1.5C5.8 4.9 5.1 6.4 5.1 8.3c0 3.3 2 4.7 5.3 5.9 2.1.8 2.8 1.3 2.8 2.2 0 .8-.7 1.3-2 1.3-1.6 0-4.2-.8-5.9-1.8L4.5 20.5c1.5.8 4.2 1.6 7 1.6 2.1 0 3.9-.5 5.1-1.5 1.4-1.1 2.1-2.6 2.1-4.7 0-3.4-2.1-4.8-5.4-6.2z" fill-rule="evenodd"/></svg>`,
  },
  {
    id: "lemonsqueezy", name: "Lemon Squeezy", category: "Payments", tagline: "Merchant of record for digital",
    color: "#FFC233", bg: "#1F1700",
    accountUrl: "https://app.lemonsqueezy.com", docs: "https://docs.lemonsqueezy.com",
    pricing: "5% + 50¢ per transaction",
    logo: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-.7 1-.7 2 0 3-3.5.5-6.5 4-6.5 9 0 5 3.5 8 7.5 8s7.5-3 7.5-8c0-5-3-8.5-6.5-9 .7-1 .7-2-.5-3h-1.5z" fill-rule="evenodd"/></svg>`,
  },

  // AI
  {
    id: "anthropic", name: "Anthropic", category: "AI", tagline: "Claude API — frontier models",
    color: "#D97757", bg: "#1F0E08",
    accountUrl: "https://console.anthropic.com", docs: "https://docs.anthropic.com",
    pricing: "Pay-per-token · Sonnet $3/$15 per Mtok",
    logo: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11 2h2v8.4l5.9-5.9 1.4 1.4-5.9 5.9H22v2h-7.6l5.9 5.9-1.4 1.4-5.9-5.9V22h-2v-7.6l-5.9 5.9-1.4-1.4 5.9-5.9H2v-2h7.6L3.7 5.1l1.4-1.4L11 9.6V2z"/></svg>`,
  },
  {
    id: "openai", name: "OpenAI", category: "AI", tagline: "GPT, Whisper, embeddings, realtime",
    color: "#10A37F", bg: "#06180F",
    accountUrl: "https://platform.openai.com", docs: "https://platform.openai.com/docs",
    pricing: "Pay-per-token · GPT-4o $2.50/$10 per Mtok",
    logo: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 9.5a6 6 0 00-.5-5 6 6 0 00-6.5-3 6 6 0 00-10.2 2A6 6 0 002.5 14a6 6 0 00.5 5 6 6 0 006.5 3 6 6 0 0010.2-2 6 6 0 002.3-10.5zM13.5 21a4.5 4.5 0 01-2.9-1l.1-.1 4.9-2.9c.3-.1.4-.4.4-.7v-7l2 1.2v5.7a4.5 4.5 0 01-4.5 4.8zm-9.7-4.1a4.5 4.5 0 01-.5-3l.1.1 4.9 2.9c.2.2.6.2.8 0l6-3.5v2.4l-5 2.9a4.5 4.5 0 01-6.3-1.8zM3 7.5a4.5 4.5 0 012.4-2v5.9c0 .3.2.6.4.7l6 3.5L9.7 17 4.7 14a4.5 4.5 0 01-1.7-6.5zm17 3.9-6-3.5L16 7l5 2.9a4.5 4.5 0 01-.5 8 4.5 4.5 0 01-3 1V13c0-.3-.2-.6-.4-.7zm2-3-.1-.1-4.9-2.9a.8.8 0 00-.8 0L10 8v-2.4l5-2.9a4.5 4.5 0 016.7 4.7zm-13 4.2-2-1.2V5.7a4.5 4.5 0 017.4-3.5L12.3 2.4 7.5 5.2a.8.8 0 00-.4.7v6.8z" fill-rule="evenodd"/></svg>`,
  },
  {
    id: "replicate", name: "Replicate", category: "AI", tagline: "Run open-source ML models via API",
    color: "#FFFFFF", bg: "#000000",
    accountUrl: "https://replicate.com", docs: "https://replicate.com/docs",
    pricing: "Pay-per-second · varies by model",
    logo: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 4h18v3H6v3h12v3H6v3h9v3H3z" fill-rule="evenodd"/></svg>`,
  },

  // DESIGN & CMS
  {
    id: "figma", name: "Figma", category: "Design", tagline: "Collaborative design & prototyping",
    color: "#F24E1E", bg: "#1F0805",
    accountUrl: "https://figma.com", docs: "https://help.figma.com",
    pricing: "Free · Pro $15/editor · Org $45/editor",
    logo: `<svg viewBox="0 0 38 57" fill="currentColor"><path d="M19 28a10 10 0 1119 0 10 10 0 01-19 0zM0 47a10 10 0 0110-10h9v19a10 10 0 01-19-9zM19 0v19h10a10 10 0 000-19h-10zM0 9a10 10 0 0010 10h9V0h-9A10 10 0 000 9zM0 28a10 10 0 0010 10h9V19h-9A10 10 0 000 28z"/></svg>`,
  },
  {
    id: "sanity", name: "Sanity", category: "Design", tagline: "Composable headless CMS",
    color: "#F03E2F", bg: "#1F0805",
    accountUrl: "https://sanity.io/manage", docs: "https://www.sanity.io/docs",
    pricing: "Free · Growth $99/mo · Enterprise",
    logo: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 6c0-2.2 2.4-3.7 5.5-3.7 4 0 6.4 2 6.9 5l-3.5.6c-.3-1.5-1.5-2.4-3.5-2.4-1.5 0-2.5.5-2.5 1.4 0 1 .8 1.5 3 2l1.6.4c3.4.8 5.5 2.5 5.5 5.4 0 2.5-2 4.4-5 5l-3-2.7c2 0 3.4-.6 3.4-1.7 0-.9-.7-1.4-2.7-1.9l-1.6-.4C8 12 6.4 10.6 6.4 7.6c0-.5.2-1 .6-1.6zm10.6 11.4c1.2.6 2 1.4 2.4 2.4-2.2 1.6-5.7 2-9 1.4-3-.5-4.6-2-5.5-4l3.5-1c.5 1.4 1.7 2.2 4.5 2.2 1.6 0 2.8-.4 4.1-1z" fill-rule="evenodd"/></svg>`,
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
