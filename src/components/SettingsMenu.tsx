import { useEffect, useRef, useState } from "react";
import { Icon } from "../lib/icons";
import { downloadConfig, importConfigFromFile } from "../lib/config";
import type { Accent, CardStyle, Density, Prefs } from "../types";

const ACCENT_OPTIONS: { value: Accent; label: string; swatch: string }[] = [
  { value: "neon", label: "Neon", swatch: "#00e599" },
  { value: "ember", label: "Ember", swatch: "#ff7849" },
  { value: "violet", label: "Violet", swatch: "#a78bfa" },
  { value: "ice", label: "Ice", swatch: "#7ad9ff" },
  { value: "paper", label: "Paper", swatch: "#e7eaef" },
];

const DENSITY_OPTIONS: { value: Density; label: string }[] = [
  { value: "comfortable", label: "Comfy" },
  { value: "compact", label: "Compact" },
];

const CARD_STYLE_OPTIONS: { value: CardStyle; label: string }[] = [
  { value: "minimal", label: "Minimal" },
  { value: "bordered", label: "Bordered" },
  { value: "glow", label: "Glow" },
];

interface Props {
  prefs: Prefs;
  setPref: <K extends keyof Prefs>(key: K, value: Prefs[K]) => void;
}

export function SettingsMenu({ prefs, setPref }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ kind: "idle" | "ok" | "err"; msg?: string }>({
    kind: "idle",
  });

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-importing the same file later
    if (!file) return;
    try {
      const count = await importConfigFromFile(file);
      setImportStatus({ kind: "ok", msg: `${count} ${count === 1 ? "section" : "sections"} imported. Reloading…` });
      // Brief delay so the user sees the success line, then reload to rehydrate state.
      window.setTimeout(() => window.location.reload(), 700);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Couldn't read file";
      setImportStatus({ kind: "err", msg });
    }
  };

  // Close on outside click + Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="settings-wrap" ref={wrapRef}>
      <button
        type="button"
        className="icon-btn"
        onClick={() => setOpen((s) => !s)}
        title="Settings"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Icon.cog />
      </button>
      {open && (
        <div className="settings-menu" role="menu">
          <div className="settings-section">
            <div className="settings-label">Accent</div>
            <div className="settings-swatches">
              {ACCENT_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  className={`settings-swatch ${prefs.accent === o.value ? "on" : ""}`}
                  onClick={() => setPref("accent", o.value)}
                  title={o.label}
                  aria-label={o.label}
                >
                  <span className="settings-swatch-dot" style={{ background: o.swatch }} />
                  <span>{o.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-label">Density</div>
            <div className="settings-seg">
              {DENSITY_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  className={prefs.density === o.value ? "on" : ""}
                  onClick={() => setPref("density", o.value)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-label">Card style</div>
            <div className="settings-seg">
              {CARD_STYLE_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  className={prefs.cardStyle === o.value ? "on" : ""}
                  onClick={() => setPref("cardStyle", o.value)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-label">Backup</div>
            <div className="settings-row">
              <button
                type="button"
                className="ghost-btn small settings-export"
                onClick={() => downloadConfig()}
                title="Download a JSON backup of your stack, prefs, keys, and custom tools"
              >
                Export config
              </button>
              <button
                type="button"
                className="ghost-btn small"
                onClick={() => fileInputRef.current?.click()}
                title="Restore from a previously-exported JSON file"
              >
                Import…
              </button>
            </div>
            {importStatus.kind === "err" && (
              <div className="settings-import-msg err">{importStatus.msg}</div>
            )}
            {importStatus.kind === "ok" && (
              <div className="settings-import-msg ok">{importStatus.msg}</div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={onPickFile}
              style={{ display: "none" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
