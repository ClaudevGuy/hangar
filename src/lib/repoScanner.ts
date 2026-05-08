// Repo Scanner — uses the File System Access API to read a project's
// package.json and .env files, infers which Hangar tools the project uses,
// and surfaces optional env values for one-click vault import.
//
// Local-first: nothing leaves the browser. Permission is per-pick, read-only.
// Browser support: Chromium-based (Chrome, Edge, Brave, Arc, Opera).
// Safari and Firefox don't expose `showDirectoryPicker` yet — the modal
// gracefully falls back to a "browser not supported" message.

// ─────────────────────────────────────────────────────────────────────────
// Type augmentation — File System Access API isn't fully typed in lib.dom.
// We declare just the shapes we touch.
// ─────────────────────────────────────────────────────────────────────────
declare global {
  interface Window {
    showDirectoryPicker?: (opts?: {
      mode?: "read" | "readwrite";
      id?: string;
    }) => Promise<FileSystemDirectoryHandle>;
  }
  interface FileSystemDirectoryHandle {
    entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
    getFileHandle(name: string): Promise<FileSystemFileHandle>;
  }
}

export function isFileSystemAccessSupported(): boolean {
  return typeof window !== "undefined" && typeof window.showDirectoryPicker === "function";
}

// ─────────────────────────────────────────────────────────────────────────
// Mappings — package name → tool id, env-var pattern → tool id.
// Conservative: only matched when the package import or env var is unmistakable.
// ─────────────────────────────────────────────────────────────────────────

// Each entry: a regex tested against package names from package.json.
const PACKAGE_RULES: { match: RegExp; toolId: string }[] = [
  { match: /^stripe$|^@stripe\//, toolId: "stripe" },
  { match: /^@anthropic-ai\//, toolId: "anthropic" },
  { match: /^openai$/, toolId: "openai" },
  { match: /^replicate$/, toolId: "replicate" },
  { match: /^resend$/, toolId: "resend" },
  { match: /^postmark$/, toolId: "postmark" },
  { match: /^@clerk\//, toolId: "clerk" },
  { match: /^@auth0\//, toolId: "auth0" },
  { match: /^@workos-inc\//, toolId: "workos" },
  { match: /^@sentry\//, toolId: "sentry" },
  { match: /^posthog-js$|^posthog-node$/, toolId: "posthog" },
  { match: /^@datadog\/|^dd-trace$/, toolId: "datadog" },
  { match: /^octokit$|^@octokit\//, toolId: "github" },
  { match: /^@vercel\//, toolId: "vercel" },
  { match: /^@linear\//, toolId: "linear" },
  { match: /^inngest$/, toolId: "inngest" },
  { match: /^@trigger\.dev\//, toolId: "trigger" },
  { match: /^@upstash\//, toolId: "upstash" },
  { match: /^@neondatabase\//, toolId: "neon" },
  { match: /^@supabase\//, toolId: "supabase" },
  { match: /^mongodb$|^mongoose$/, toolId: "mongodb" },
  { match: /^@planetscale\//, toolId: "planetscale" },
  { match: /^figma-api$/, toolId: "figma" },
  { match: /^@sanity\/client$|^sanity$/, toolId: "sanity" },
  { match: /^@lemonsqueezy\//, toolId: "lemonsqueezy" },
  { match: /^@cloudflare\/|^wrangler$/, toolId: "cloudflare" },
  { match: /^netlify-cli$|^@netlify\//, toolId: "netlify" },
];

// Each entry: a regex tested against env var NAMES (not values). Names only —
// values are kept private and surfaced as masked options in the import flow.
const ENV_RULES: { match: RegExp; toolId: string }[] = [
  { match: /^STRIPE_/, toolId: "stripe" },
  { match: /^ANTHROPIC_/, toolId: "anthropic" },
  { match: /^OPENAI_/, toolId: "openai" },
  { match: /^REPLICATE_/, toolId: "replicate" },
  { match: /^RESEND_/, toolId: "resend" },
  { match: /^POSTMARK_/, toolId: "postmark" },
  { match: /^CLERK_|^NEXT_PUBLIC_CLERK_/, toolId: "clerk" },
  { match: /^AUTH0_/, toolId: "auth0" },
  { match: /^WORKOS_/, toolId: "workos" },
  { match: /^SENTRY_|^NEXT_PUBLIC_SENTRY_/, toolId: "sentry" },
  { match: /^POSTHOG_|^NEXT_PUBLIC_POSTHOG_/, toolId: "posthog" },
  { match: /^DATADOG_|^DD_/, toolId: "datadog" },
  { match: /^GITHUB_TOKEN$|^GH_TOKEN$|^GITHUB_PAT$/, toolId: "github" },
  { match: /^VERCEL_/, toolId: "vercel" },
  { match: /^LINEAR_/, toolId: "linear" },
  { match: /^INNGEST_/, toolId: "inngest" },
  { match: /^TRIGGER_/, toolId: "trigger" },
  { match: /^UPSTASH_/, toolId: "upstash" },
  { match: /^NEON_|^DATABASE_URL$/, toolId: "neon" }, // DATABASE_URL is a heuristic
  { match: /^SUPABASE_|^NEXT_PUBLIC_SUPABASE_/, toolId: "supabase" },
  { match: /^MONGODB_|^MONGO_URI$|^MONGO_URL$/, toolId: "mongodb" },
  { match: /^PLANETSCALE_/, toolId: "planetscale" },
  { match: /^FIGMA_/, toolId: "figma" },
  { match: /^SANITY_|^NEXT_PUBLIC_SANITY_/, toolId: "sanity" },
  { match: /^LEMON_?SQUEEZY_/, toolId: "lemonsqueezy" },
  { match: /^CLOUDFLARE_|^CF_API_/, toolId: "cloudflare" },
  { match: /^NETLIFY_/, toolId: "netlify" },
  { match: /^FLY_API_TOKEN$|^FLY_ACCESS_TOKEN$/, toolId: "fly" },
];

function matchPackage(name: string): string | null {
  for (const rule of PACKAGE_RULES) if (rule.match.test(name)) return rule.toolId;
  return null;
}

function matchEnvVar(name: string): string | null {
  for (const rule of ENV_RULES) if (rule.match.test(name)) return rule.toolId;
  return null;
}

// DATABASE_URL is ambiguous — could be Neon, Supabase, PlanetScale, plain
// Postgres, etc. If we have the value, look at the host to pick.
function refineDatabaseUrl(value: string): string | null {
  if (!value) return null;
  if (/neon\.tech/.test(value)) return "neon";
  if (/supabase\./.test(value)) return "supabase";
  if (/pscale|planetscale/.test(value)) return "planetscale";
  if (/mongodb(\+srv)?:\/\//.test(value)) return "mongodb";
  return null; // bail — generic postgres etc.
}

// ─────────────────────────────────────────────────────────────────────────
// File reading helpers
// ─────────────────────────────────────────────────────────────────────────

async function readFileText(
  dir: FileSystemDirectoryHandle,
  name: string,
): Promise<string | null> {
  try {
    const fh = await dir.getFileHandle(name);
    const file = await fh.getFile();
    return await file.text();
  } catch {
    // File doesn't exist, or permission was denied — both end the scan for this name.
    return null;
  }
}

interface PackageJson {
  name?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}

function parsePackageJson(text: string): PackageJson | null {
  try {
    return JSON.parse(text) as PackageJson;
  } catch {
    return null;
  }
}

// Parse a dotenv-style file. Returns ordered name/value pairs; tolerates the
// common shapes (KEY=value, KEY="value", KEY='value', export KEY=value),
// skips blank/comment lines.
export interface EnvPair {
  name: string;
  value: string;
}

export function parseDotenv(text: string): EnvPair[] {
  const out: EnvPair[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const stripped = line.replace(/^export\s+/, "");
    const eq = stripped.indexOf("=");
    if (eq < 0) continue;
    const name = stripped.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) continue;
    let value = stripped.slice(eq + 1).trim();
    // Strip wrapping quotes.
    if (value.length >= 2) {
      const first = value[0];
      const last = value[value.length - 1];
      if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
        value = value.slice(1, -1);
      }
    }
    // Drop trailing inline comments for unquoted values.
    if (!/^["']/.test(stripped.slice(eq + 1).trim())) {
      const hash = value.indexOf(" #");
      if (hash > 0) value = value.slice(0, hash).trim();
    }
    out.push({ name, value });
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────
// Public API — pick a directory, scan it, return findings.
// ─────────────────────────────────────────────────────────────────────────

export async function pickDirectory(): Promise<FileSystemDirectoryHandle | null> {
  if (!isFileSystemAccessSupported()) {
    throw new Error(
      "This browser doesn't support the File System Access API. " +
        "Try a Chromium-based browser (Chrome, Edge, Brave, Arc, Opera).",
    );
  }
  try {
    return await window.showDirectoryPicker!({ mode: "read", id: "hangar-repo-scan" });
  } catch (err) {
    // The user cancelled the picker — return null so callers can quietly bail.
    if (err instanceof DOMException && err.name === "AbortError") return null;
    throw err;
  }
}

export interface ScanFinding {
  toolId: string;
  // Why we matched: humanized reasons for the UI.
  reasons: string[];
  // Env vars that look like they belong to this tool, with values when found.
  // Values are NEVER displayed in plaintext in the modal — the UI masks them.
  envVars: EnvPair[];
}

export interface ScanResult {
  rootName: string;
  findings: ScanFinding[];
  // Filenames we attempted to read and couldn't parse — informational.
  warnings: string[];
}

const ENV_FILES = [".env", ".env.local", ".env.development.local", ".env.example"];

export async function scanRepo(dir: FileSystemDirectoryHandle): Promise<ScanResult> {
  const warnings: string[] = [];
  // toolId -> aggregated finding
  const byTool = new Map<string, ScanFinding>();

  const ensure = (toolId: string): ScanFinding => {
    let f = byTool.get(toolId);
    if (!f) {
      f = { toolId, reasons: [], envVars: [] };
      byTool.set(toolId, f);
    }
    return f;
  };

  // ── package.json ─────────────────────────────────────────────────────
  const pkgText = await readFileText(dir, "package.json");
  if (pkgText) {
    const pkg = parsePackageJson(pkgText);
    if (!pkg) {
      warnings.push("package.json was unreadable (invalid JSON)");
    } else {
      const allDeps: string[] = [
        ...Object.keys(pkg.dependencies ?? {}),
        ...Object.keys(pkg.devDependencies ?? {}),
        ...Object.keys(pkg.peerDependencies ?? {}),
        ...Object.keys(pkg.optionalDependencies ?? {}),
      ];
      const seenPackages = new Set<string>();
      for (const dep of allDeps) {
        if (seenPackages.has(dep)) continue;
        seenPackages.add(dep);
        const toolId = matchPackage(dep);
        if (toolId) {
          const f = ensure(toolId);
          if (!f.reasons.includes(`pkg: ${dep}`)) {
            f.reasons.push(`pkg: ${dep}`);
          }
        }
      }
    }
  }

  // ── .env files (in priority order — first occurrence of a name wins) ──
  const seenEnvNames = new Set<string>();
  for (const fname of ENV_FILES) {
    const text = await readFileText(dir, fname);
    if (!text) continue;
    const pairs = parseDotenv(text);
    for (const p of pairs) {
      if (seenEnvNames.has(p.name)) continue;
      seenEnvNames.add(p.name);
      let toolId = matchEnvVar(p.name);
      // Refine ambiguous DATABASE_URL using the value's host.
      if (toolId === "neon" && p.name === "DATABASE_URL") {
        const refined = refineDatabaseUrl(p.value);
        if (refined) toolId = refined;
        else continue; // skip — generic DB url, no clear mapping
      }
      if (!toolId) continue;
      const f = ensure(toolId);
      // Don't store .env.example values — those are placeholders, not real keys.
      const isExample = fname.endsWith(".example");
      f.envVars.push({ name: p.name, value: isExample ? "" : p.value });
      const reason = `env: ${p.name}${isExample ? " (.example)" : ""}`;
      if (!f.reasons.includes(reason)) f.reasons.push(reason);
    }
  }

  // Sort findings: tools with the most evidence first.
  const findings = Array.from(byTool.values()).sort(
    (a, b) => b.reasons.length - a.reasons.length,
  );

  return {
    // FileSystemDirectoryHandle.name isn't typed everywhere; cast via unknown.
    rootName: (dir as unknown as { name: string }).name ?? "(repo)",
    findings,
    warnings,
  };
}
