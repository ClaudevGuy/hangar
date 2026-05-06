import type { ToolMetaMap } from "../hooks/useToolMeta";
import type { Tool } from "../types";

// MCP-shaped subset of a Tool. Mirrors what hangar-mcp's `read_stack` tool
// returns from ~/.hangar/mcp.json — keep fields aligned with mcp/src/index.ts.
interface McpStackTool {
  id: string;
  name: string;
  category?: string;
  plan?: string;
  lastOpenedAt?: number;
}

interface McpStackConfig {
  tools: McpStackTool[];
}

// Builds the JSON file the Hangar MCP server expects at ~/.hangar/mcp.json.
// User overrides on plan win; we fall back to the static `tool.plan` if any.
export function buildMcpConfig(stackTools: Tool[], toolMeta: ToolMetaMap): McpStackConfig {
  const tools: McpStackTool[] = stackTools.map((t) => {
    const m = toolMeta[t.id];
    const entry: McpStackTool = {
      id: t.id,
      name: t.name,
      category: t.category,
    };
    const plan = m?.plan ?? t.plan;
    if (plan) entry.plan = plan;
    if (m?.lastOpenedAt) entry.lastOpenedAt = m.lastOpenedAt;
    return entry;
  });
  return { tools };
}

// Trigger a browser download of mcp.json with the user's current stack.
export function downloadMcpConfig(stackTools: Tool[], toolMeta: ToolMetaMap): void {
  const json = JSON.stringify(buildMcpConfig(stackTools, toolMeta), null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "mcp.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
