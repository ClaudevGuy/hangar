// Curated starter stacks — click one to seed your pinned tools.
// IDs reference built-in tool ids in data/tools.ts.

export interface StarterStack {
  id: string;
  name: string;
  tagline: string;
  toolIds: string[];
}

export const STARTER_STACKS: StarterStack[] = [
  {
    id: "ai-app",
    name: "AI app",
    tagline: "Models + DB + auth + emails — ship a Claude/GPT product",
    toolIds: ["vercel", "neon", "anthropic", "clerk", "resend", "stripe", "sentry", "github"],
  },
  {
    id: "saas",
    name: "SaaS starter",
    tagline: "Classic Next.js SaaS — payments, email, monitoring",
    toolIds: ["vercel", "neon", "clerk", "stripe", "resend", "posthog", "sentry", "github", "linear"],
  },
  {
    id: "static-site",
    name: "Static site",
    tagline: "Marketing site, blog, portfolio — minimal moving parts",
    toolIds: ["vercel", "github", "figma", "sanity", "resend"],
  },
  {
    id: "indie",
    name: "Indie hacker",
    tagline: "Side-project survival kit — cheap, fast, low overhead",
    toolIds: ["vercel", "supabase", "lemonsqueezy", "resend", "posthog", "github"],
  },
  {
    id: "api-only",
    name: "API / backend",
    tagline: "Workers, queues, monitoring — no frontend",
    toolIds: ["fly", "neon", "upstash", "inngest", "sentry", "datadog", "github"],
  },
  {
    id: "design-heavy",
    name: "Design-led",
    tagline: "Frontend + CMS + design tools",
    toolIds: ["vercel", "sanity", "figma", "github", "linear", "resend"],
  },
];
