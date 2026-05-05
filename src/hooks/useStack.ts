import { useEffect, useState } from "react";

const STORAGE_KEY = "hangar-stack";
// Seed mirrors the prototype's first-run default so anyone migrating from the
// design preview keeps the same pinned tools.
const DEFAULT_SEED: string[] = [
  "github", "vercel", "neon", "clerk", "resend",
  "sentry", "stripe", "anthropic", "figma", "posthog",
];

function read(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SEED;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_SEED;
    return parsed.filter((x): x is string => typeof x === "string");
  } catch {
    return DEFAULT_SEED;
  }
}

export function useStack() {
  const [stack, setStack] = useState<string[]>(read);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stack));
  }, [stack]);

  return [stack, setStack] as const;
}
