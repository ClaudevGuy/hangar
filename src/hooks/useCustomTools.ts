import { useCallback, useEffect, useState } from "react";
import type { Tool } from "../types";

const STORAGE_KEY = "hangar-custom-tools";

function read(): Tool[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    // Light sanity check — we trust our own writes, but don't crash on garbage.
    return parsed.filter((t): t is Tool =>
      !!t && typeof t === "object" &&
      typeof (t as Tool).id === "string" &&
      typeof (t as Tool).name === "string" &&
      typeof (t as Tool).accountUrl === "string",
    );
  } catch {
    return [];
  }
}

export function useCustomTools() {
  const [tools, setTools] = useState<Tool[]>(read);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tools));
  }, [tools]);

  const addTool = useCallback((tool: Tool) => {
    setTools((prev) => [...prev, tool]);
  }, []);

  const removeTool = useCallback((id: string) => {
    setTools((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { customTools: tools, addTool, removeTool } as const;
}
