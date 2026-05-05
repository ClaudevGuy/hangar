import type { Tool, ToolCategory } from "../types";

export interface CustomToolInput {
  name: string;
  accountUrl: string;
  category: ToolCategory;
  tagline?: string;
  color?: string;
  bg?: string;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
}

function initialsOf(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// SVG monogram tile — the initials in the tool's foreground color, sized to
// match the inline-SVG approach used by the built-in catalog so ToolLogo
// renders both the same way.
export function makeInitialsLogo(name: string): string {
  const initials = escapeXml(initialsOf(name));
  const fontSize = initials.length > 1 ? 38 : 56;
  return `<svg viewBox="0 0 100 100" fill="currentColor"><text x="50" y="50" text-anchor="middle" dominant-baseline="central" font-family="ui-sans-serif, system-ui, -apple-system, sans-serif" font-weight="700" font-size="${fontSize}">${initials}</text></svg>`;
}

export function buildCustomTool(input: CustomToolInput): Tool {
  const url = input.accountUrl.trim();
  const id = `custom_${slugify(input.name)}_${Math.random().toString(36).slice(2, 6)}`;
  const color = input.color || "#e7eaef";
  const bg = input.bg || "#1a1a1a";
  return {
    id,
    name: input.name.trim(),
    category: input.category,
    tagline: (input.tagline || "Custom tool").trim(),
    color,
    bg,
    accountUrl: url,
    docs: url,
    pricing: "Custom",
    logo: makeInitialsLogo(input.name),
    custom: true,
  };
}

export function isValidUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
