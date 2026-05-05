import type { Tool } from "../types";

interface Props {
  tool: Tool;
  size?: number;
}

export function ToolLogo({ tool, size = 40 }: Props) {
  return (
    <div
      className="tool-logo"
      style={{ width: size, height: size, background: tool.bg, color: tool.color }}
      dangerouslySetInnerHTML={{ __html: tool.logo }}
    />
  );
}
