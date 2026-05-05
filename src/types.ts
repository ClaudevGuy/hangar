export type Theme = "dark" | "light";
export type Accent = "neon" | "ember" | "violet" | "ice" | "paper";
export type Density = "comfortable" | "compact";
export type CardStyle = "minimal" | "bordered" | "glow";

export type ToolCategory =
  | "Hosting"
  | "Database"
  | "Auth"
  | "Code"
  | "Jobs"
  | "Monitoring"
  | "Email"
  | "Payments"
  | "AI"
  | "Design";

export type CategoryId = "all" | ToolCategory;

export interface Tool {
  id: string;
  name: string;
  category: ToolCategory;
  tagline: string;
  color: string;
  bg: string;
  accountUrl: string;
  docs: string;
  pricing: string;
  plan?: string;
  status?: "live";
  logo: string;
  // Marks tools the user added themselves via "Add tool". Affects whether
  // we let them delete it from the catalog.
  custom?: boolean;
}

export interface Category {
  id: CategoryId;
  name: string;
  icon: string;
}

export interface ActivityItem {
  tool: string;
  text: string;
  repo: string | null;
  time: string;
}

export interface Prefs {
  theme: Theme;
  accent: Accent;
  density: Density;
  cardStyle: CardStyle;
}

export interface SecretEntry {
  id: string;
  label: string;
  value: string;
}

// Linkboard — context items pinned across tools while you work on something.
// Each entry has a tool id (so we know which logo to show + how to deep-link)
// or `null` for free-form URLs we couldn't classify.
export interface LinkItem {
  id: string;
  label: string;
  url: string;
  toolId: string | null;
  addedAt: number;
}

// Map of toolId → list of stored API keys / tokens for that tool.
export type SecretsMap = Record<string, SecretEntry[]>;
