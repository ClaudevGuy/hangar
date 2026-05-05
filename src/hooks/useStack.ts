import { useEffect, useState } from "react";

const STORAGE_KEY = "hangar-stack";
// New users start with an empty stack — they pin what they actually use.
const DEFAULT_SEED: string[] = [];

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
