import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES } from "../data/tools";
import { Icon } from "../lib/icons";
import { buildCustomTool, isValidUrl } from "../lib/customTool";
import type { Tool, ToolCategory } from "../types";
import { ToolLogo } from "./ToolLogo";

interface Props {
  onAdd: (tool: Tool) => void;
  onUpdate?: (tool: Tool) => void;
  onClose: () => void;
  // When set, the modal opens in edit mode pre-filled with the tool's values.
  existingTool?: Tool;
}

const PRESET_COLORS = [
  "#e7eaef", "#00e599", "#ff7849", "#a78bfa", "#7ad9ff",
  "#fbbf24", "#f472b6", "#34d399", "#60a5fa", "#fca5a5",
];

export function AddToolModal({ onAdd, onUpdate, onClose, existingTool }: Props) {
  const isEdit = !!existingTool;
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(existingTool?.name ?? "");
  const [accountUrl, setAccountUrl] = useState(existingTool?.accountUrl ?? "");
  const [tagline, setTagline] = useState(
    existingTool && existingTool.tagline !== "Custom tool" ? existingTool.tagline : "",
  );
  // Pre-select a real category (not "all") — Hosting is broad enough as a default.
  const [category, setCategory] = useState<ToolCategory>(existingTool?.category ?? "Hosting");
  const [color, setColor] = useState(existingTool?.color ?? PRESET_COLORS[0]);

  useEffect(() => {
    firstFieldRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Auto-derive tagline from URL hostname if user hasn't typed one.
  const hostname = useMemo(() => {
    try {
      return new URL(accountUrl).hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  }, [accountUrl]);

  const previewTool = useMemo<Tool>(
    () =>
      buildCustomTool({
        name: name || "Your tool",
        accountUrl: accountUrl || "https://example.com",
        category,
        tagline: tagline || (hostname ? `Custom tool · ${hostname}` : "Custom tool"),
        color,
        bg: "#1a1a1a",
      }),
    [name, accountUrl, category, tagline, color, hostname],
  );

  const urlOk = isValidUrl(accountUrl);
  const nameOk = name.trim().length > 0;
  const canSubmit = nameOk && urlOk;

  const submit = () => {
    if (!canSubmit) return;
    const finalTagline = tagline || `Custom tool · ${hostname || ""}`.trim().replace(/ ·\s*$/, "");
    if (isEdit && existingTool && onUpdate) {
      // Preserve id + custom flag; update the editable fields.
      onUpdate({
        ...existingTool,
        name: name.trim(),
        accountUrl: accountUrl.trim(),
        docs: accountUrl.trim(),
        category,
        tagline: finalTagline,
        color,
        // Re-render the monogram in case the name changed.
        logo: buildCustomTool({ name, accountUrl, category, tagline: finalTagline, color }).logo,
      });
    } else {
      onAdd(
        buildCustomTool({
          name,
          accountUrl,
          category,
          tagline: finalTagline,
          color,
          bg: "#1a1a1a",
        }),
      );
    }
    onClose();
  };

  // Pickable categories — exclude the "all" pseudo-category.
  const realCategories = CATEGORIES.filter((c) => c.id !== "all");

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="add-tool-modal" onClick={(e) => e.stopPropagation()}>
        <header className="compare-head">
          <h2>{isEdit ? `Edit ${existingTool!.name}` : "Add a custom tool"}</h2>
          <button type="button" className="drawer-x" onClick={onClose}>
            <Icon.close />
          </button>
        </header>

        <div className="add-tool-body">
          <div className="add-tool-form">
            <label className="add-tool-row">
              <span className="add-tool-lbl">Name</span>
              <input
                ref={firstFieldRef}
                className="keys-input"
                type="text"
                placeholder="e.g. Hetzner"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canSubmit) submit();
                }}
              />
            </label>

            <label className="add-tool-row">
              <span className="add-tool-lbl">Dashboard URL</span>
              <input
                className="keys-input"
                type="url"
                placeholder="https://console.hetzner.cloud"
                value={accountUrl}
                onChange={(e) => setAccountUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canSubmit) submit();
                }}
              />
              {accountUrl && !urlOk && (
                <span className="add-tool-warn">Needs to be a full http(s) URL</span>
              )}
            </label>

            <label className="add-tool-row">
              <span className="add-tool-lbl">Category</span>
              <select
                className="keys-input"
                value={category}
                onChange={(e) => setCategory(e.target.value as ToolCategory)}
              >
                {realCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="add-tool-row">
              <span className="add-tool-lbl">
                Tagline <span className="muted">(optional)</span>
              </span>
              <input
                className="keys-input"
                type="text"
                placeholder={hostname ? `Custom tool · ${hostname}` : "What does it do?"}
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                maxLength={80}
              />
            </label>

            <div className="add-tool-row">
              <span className="add-tool-lbl">Brand color</span>
              <div className="add-tool-swatches">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`color-swatch ${color === c ? "on" : ""}`}
                    style={{ background: c }}
                    onClick={() => setColor(c)}
                    title={c}
                    aria-label={`Color ${c}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <aside className="add-tool-preview">
            <div className="add-tool-preview-lbl">Preview</div>
            <article className="card add-tool-preview-card">
              <div className="card-top">
                <ToolLogo tool={previewTool} size={44} />
              </div>
              <h3 className="card-name">{previewTool.name}</h3>
              <p className="card-tag">{previewTool.tagline}</p>
              <div className="card-foot">
                <span className="card-cat">{previewTool.category}</span>
              </div>
            </article>
          </aside>
        </div>

        <footer className="add-tool-foot">
          <button type="button" className="ghost-btn small" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="primary-btn small" disabled={!canSubmit} onClick={submit}>
            {isEdit ? "Save changes" : "Add tool"}
          </button>
        </footer>
      </div>
    </div>
  );
}
