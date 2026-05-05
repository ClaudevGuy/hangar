// Per-tool quick actions surfaced in the drawer. URL-based for now —
// each action just opens a deep-link in the dashboard. Extending to
// real API calls is per-tool work; this is the v0.

export interface QuickAction {
  label: string;
  url: string;
  description?: string;
}

export const QUICK_ACTIONS: Record<string, QuickAction[]> = {
  github: [
    { label: "New repository", url: "https://github.com/new", description: "Spin up a new GitHub repo" },
    { label: "New gist", url: "https://gist.github.com/", description: "Create a quick gist" },
    { label: "Pull requests", url: "https://github.com/pulls", description: "Your PRs across all repos" },
    { label: "Notifications", url: "https://github.com/notifications" },
  ],
  vercel: [
    { label: "Add new project", url: "https://vercel.com/new", description: "Import a Git repo into Vercel" },
    { label: "Recent deployments", url: "https://vercel.com/dashboard?tab=deployments" },
    { label: "Domains", url: "https://vercel.com/dashboard/domains" },
    { label: "Account settings", url: "https://vercel.com/account" },
  ],
  linear: [
    { label: "My active issues", url: "https://linear.app/issues/active" },
    { label: "My triage", url: "https://linear.app/inbox" },
    { label: "Roadmap", url: "https://linear.app/roadmap" },
  ],
  neon: [
    { label: "New project", url: "https://console.neon.tech/app/projects" },
    { label: "Branches", url: "https://console.neon.tech/" },
    { label: "Billing", url: "https://console.neon.tech/app/billing" },
  ],
  supabase: [
    { label: "New project", url: "https://supabase.com/dashboard/new" },
    { label: "Account", url: "https://supabase.com/dashboard/account/me" },
  ],
  stripe: [
    { label: "Today's payments", url: "https://dashboard.stripe.com/payments" },
    { label: "Customers", url: "https://dashboard.stripe.com/customers" },
    { label: "Subscriptions", url: "https://dashboard.stripe.com/subscriptions" },
    { label: "Logs", url: "https://dashboard.stripe.com/logs" },
  ],
  resend: [
    { label: "Send a test", url: "https://resend.com/emails" },
    { label: "Domains", url: "https://resend.com/domains" },
    { label: "API keys", url: "https://resend.com/api-keys" },
    { label: "Usage", url: "https://resend.com/usage" },
  ],
  anthropic: [
    { label: "API keys", url: "https://console.anthropic.com/settings/keys" },
    { label: "Usage", url: "https://console.anthropic.com/settings/usage" },
    { label: "Workbench", url: "https://console.anthropic.com/workbench" },
    { label: "Docs", url: "https://docs.anthropic.com" },
  ],
  openai: [
    { label: "API keys", url: "https://platform.openai.com/api-keys" },
    { label: "Usage", url: "https://platform.openai.com/usage" },
    { label: "Playground", url: "https://platform.openai.com/playground" },
  ],
  sentry: [
    { label: "Issues", url: "https://sentry.io/issues/" },
    { label: "Performance", url: "https://sentry.io/performance/" },
    { label: "Releases", url: "https://sentry.io/releases/" },
  ],
  posthog: [
    { label: "Insights", url: "https://app.posthog.com/insights" },
    { label: "Feature flags", url: "https://app.posthog.com/feature_flags" },
    { label: "Session replay", url: "https://app.posthog.com/replay" },
  ],
  clerk: [
    { label: "Users", url: "https://dashboard.clerk.com/last-active" },
    { label: "Sessions", url: "https://dashboard.clerk.com/last-active?tab=sessions" },
  ],
  cloudflare: [
    { label: "Workers", url: "https://dash.cloudflare.com/?to=/:account/workers" },
    { label: "Pages", url: "https://dash.cloudflare.com/?to=/:account/pages" },
    { label: "DNS", url: "https://dash.cloudflare.com/?to=/:account/zones" },
  ],
  netlify: [
    { label: "Sites", url: "https://app.netlify.com/" },
    { label: "Domains", url: "https://app.netlify.com/domains" },
  ],
  fly: [
    { label: "Apps", url: "https://fly.io/dashboard" },
    { label: "Billing", url: "https://fly.io/dashboard/personal/billing" },
  ],
  figma: [
    { label: "Drafts", url: "https://www.figma.com/files/recents-and-sharing/recently-viewed?fuid=me" },
    { label: "Community", url: "https://www.figma.com/community" },
  ],
  inngest: [
    { label: "Recent runs", url: "https://app.inngest.com/" },
    { label: "Functions", url: "https://app.inngest.com/" },
  ],
};
