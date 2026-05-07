import { useEffect, useRef, useState } from "react";
import type { ToolMetaMap } from "../hooks/useToolMeta";
import type { VaultState } from "../hooks/useVault";
import { Icon } from "../lib/icons";
import { downloadConfig, importConfigFromFile } from "../lib/config";
import { downloadMcpConfig } from "../lib/mcpExport";
import type { Accent, CardStyle, Density, Prefs, Tool } from "../types";

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

interface SyncStateForUI {
  status: "off" | "idle" | "syncing" | "error";
  lastSyncedAt: number | null;
  error: string | null;
}

interface Props {
  prefs: Prefs;
  setPref: <K extends keyof Prefs>(key: K, value: Prefs[K]) => void;
  vaultState: VaultState;
  onSetPassphrase: (passphrase: string) => Promise<void>;
  onChangePassphrase: (current: string, next: string) => Promise<void>;
  onRemovePassphrase: (current: string) => Promise<void>;
  onLock: () => void;
  // Sync — passing the relevant subset so SettingsMenu doesn't depend on the full hook.
  sync: SyncStateForUI;
  hasGitHubToken: boolean;
  onSyncSetUp: () => void;
  onSyncPushNow: () => void;
  onSyncPullNow: () => void;
  onSyncDisconnect: () => void;
  // For "Export MCP config" — drilled through so we can build the JSON
  // the hangar-mcp server expects at ~/.hangar/mcp.json.
  stackTools: Tool[];
  toolMeta: ToolMetaMap;
  // Opens the Share modal at the app level. Closes the settings popover.
  onOpenShare: () => void;
}

type SettingsTab = "look" | "security" | "data";

export function SettingsMenu({
  prefs, setPref, vaultState, onSetPassphrase, onChangePassphrase, onRemovePassphrase, onLock,
  sync, hasGitHubToken, onSyncSetUp, onSyncPushNow, onSyncPullNow, onSyncDisconnect,
  stackTools, toolMeta, onOpenShare,
}: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<SettingsTab>("look");
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
          <div className="settings-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "look"}
              className={tab === "look" ? "on" : ""}
              onClick={() => setTab("look")}
            >
              Look
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "security"}
              className={tab === "security" ? "on" : ""}
              onClick={() => setTab("security")}
            >
              Security
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "data"}
              className={tab === "data" ? "on" : ""}
              onClick={() => setTab("data")}
            >
              Data
            </button>
          </div>

          {tab === "look" && (<>
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
          </>)}

          {tab === "security" && (<>
          <div className="settings-section">
            <div className="settings-label">Security</div>
            <SecurityControls
              vaultState={vaultState}
              onSetPassphrase={onSetPassphrase}
              onChangePassphrase={onChangePassphrase}
              onRemovePassphrase={onRemovePassphrase}
              onLock={onLock}
            />
          </div>

          <div className="settings-section">
            <div className="settings-label">Sync</div>
            <SyncControls
              sync={sync}
              hasGitHubToken={hasGitHubToken}
              onSetUp={onSyncSetUp}
              onPushNow={onSyncPushNow}
              onPullNow={onSyncPullNow}
              onDisconnect={onSyncDisconnect}
            />
          </div>
          </>)}

          {tab === "data" && (<>
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

          <div className="settings-section">
            <div className="settings-label">AI agents</div>
            <div className="settings-row settings-row-vert">
              <div className="muted settings-blurb">
                Download <code>mcp.json</code> for the Hangar MCP server. Drop it at{" "}
                <code>~/.hangar/mcp.json</code> so Claude Desktop / Cursor can read your
                stack. Re-export anytime you change pinned tools or plans.
              </div>
              <button
                type="button"
                className="ghost-btn small settings-export"
                onClick={() => downloadMcpConfig(stackTools, toolMeta)}
                disabled={stackTools.length === 0}
                title={stackTools.length === 0 ? "Pin some tools first" : "Download mcp.json"}
              >
                Download mcp.json
              </button>
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-label">Share stack</div>
            <div className="settings-row settings-row-vert">
              <div className="muted settings-blurb">
                Generate a public URL of your pinned stack. The data lives in the URL
                hash — never on a server. Paste it on Twitter, Slack, anywhere.
              </div>
              <button
                type="button"
                className="ghost-btn small settings-export"
                onClick={() => {
                  setOpen(false);
                  onOpenShare();
                }}
                disabled={stackTools.length === 0}
                title={stackTools.length === 0 ? "Pin some tools first" : "Share your stack"}
              >
                Share my stack
              </button>
            </div>
          </div>
          </>)}
        </div>
      )}
    </div>
  );
}

interface SyncControlsProps {
  sync: SyncStateForUI;
  hasGitHubToken: boolean;
  onSetUp: () => void;
  onPushNow: () => void;
  onPullNow: () => void;
  onDisconnect: () => void;
}

function SyncControls({
  sync, hasGitHubToken, onSetUp, onPushNow, onPullNow, onDisconnect,
}: SyncControlsProps) {
  const fmt = (ts: number) => {
    const m = Math.floor((Date.now() - ts) / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
  };

  if (sync.status === "off") {
    return (
      <div className="settings-row settings-row-vert">
        <div className="muted settings-blurb">
          Sync your stack, prefs, custom tools, and (encrypted) vault to a private GitHub gist.
          Pick up on another machine without losing anything. Needs a GitHub PAT with
          {" "}<code>gist</code> scope in your vault.
        </div>
        <button
          type="button"
          className="primary-btn small"
          onClick={onSetUp}
          disabled={!hasGitHubToken}
          title={hasGitHubToken ? "" : "Add a GitHub PAT to your vault first"}
        >
          {hasGitHubToken ? "Set up sync" : "Add GitHub PAT first"}
        </button>
      </div>
    );
  }

  return (
    <div className="settings-row settings-row-vert">
      <div className="muted settings-blurb">
        {sync.status === "syncing"
          ? "Syncing…"
          : sync.status === "error"
            ? `Last sync failed: ${sync.error}`
            : sync.lastSyncedAt
              ? `Synced ${fmt(sync.lastSyncedAt)} · auto-push on changes`
              : "Idle"}
      </div>
      <div className="settings-row">
        <button
          type="button"
          className="ghost-btn small"
          onClick={onPushNow}
          disabled={sync.status === "syncing"}
        >
          Push now
        </button>
        <button
          type="button"
          className="ghost-btn small"
          onClick={onPullNow}
          disabled={sync.status === "syncing"}
        >
          Pull
        </button>
        <button type="button" className="ghost-btn small" onClick={onDisconnect}>
          Disconnect
        </button>
      </div>
    </div>
  );
}

interface SecurityProps {
  vaultState: VaultState;
  onSetPassphrase: (passphrase: string) => Promise<void>;
  onChangePassphrase: (current: string, next: string) => Promise<void>;
  onRemovePassphrase: (current: string) => Promise<void>;
  onLock: () => void;
}

type SecMode = "idle" | "set" | "change" | "remove";

function SecurityControls({
  vaultState, onSetPassphrase, onChangePassphrase, onRemovePassphrase, onLock,
}: SecurityProps) {
  const [mode, setMode] = useState<SecMode>("idle");
  const [pass1, setPass1] = useState("");
  const [pass2, setPass2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setMode("idle");
    setPass1("");
    setPass2("");
    setError(null);
    setBusy(false);
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      if (mode === "set") {
        if (pass1.length < 6) throw new Error("Use at least 6 characters.");
        if (pass1 !== pass2) throw new Error("Passphrases don't match.");
        await onSetPassphrase(pass1);
        reset();
      } else if (mode === "change") {
        if (pass2.length < 6) throw new Error("New passphrase: at least 6 characters.");
        await onChangePassphrase(pass1, pass2);
        reset();
      } else if (mode === "remove") {
        await onRemovePassphrase(pass1);
        reset();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  };

  if (mode === "idle") {
    if (vaultState === "open") {
      return (
        <div className="settings-row settings-row-vert">
          <div className="muted settings-blurb">
            Your API keys live in <code>localStorage</code> as plaintext. Set a master passphrase to encrypt them at rest.
          </div>
          <button type="button" className="ghost-btn small" onClick={() => setMode("set")}>
            Set master passphrase
          </button>
        </div>
      );
    }
    // unlocked or locked
    return (
      <div className="settings-row settings-row-vert">
        <div className="muted settings-blurb">
          Vault is encrypted. {vaultState === "unlocked" ? "Currently unlocked." : "Currently locked."}
        </div>
        <div className="settings-row">
          {vaultState === "unlocked" && (
            <button type="button" className="ghost-btn small" onClick={onLock}>
              Lock now
            </button>
          )}
          <button type="button" className="ghost-btn small" onClick={() => setMode("change")}>
            Change
          </button>
          <button type="button" className="ghost-btn small" onClick={() => setMode("remove")}>
            Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-row settings-row-vert">
      {(mode === "change" || mode === "remove") && (
        <input
          type="password"
          className="keys-input"
          placeholder="Current passphrase"
          value={pass1}
          onChange={(e) => setPass1(e.target.value)}
          autoComplete="current-password"
        />
      )}
      {mode === "set" && (
        <>
          <input
            type="password"
            className="keys-input"
            placeholder="New passphrase (6+ chars)"
            value={pass1}
            onChange={(e) => setPass1(e.target.value)}
            autoComplete="new-password"
          />
          <input
            type="password"
            className="keys-input"
            placeholder="Confirm passphrase"
            value={pass2}
            onChange={(e) => setPass2(e.target.value)}
            autoComplete="new-password"
          />
        </>
      )}
      {mode === "change" && (
        <input
          type="password"
          className="keys-input"
          placeholder="New passphrase (6+ chars)"
          value={pass2}
          onChange={(e) => setPass2(e.target.value)}
          autoComplete="new-password"
        />
      )}
      {error && <div className="settings-import-msg err">{error}</div>}
      <div className="settings-row">
        <button type="button" className="ghost-btn small" onClick={reset} disabled={busy}>
          Cancel
        </button>
        <button type="button" className="primary-btn small" onClick={submit} disabled={busy}>
          {busy ? "…" : mode === "remove" ? "Remove" : "Save"}
        </button>
      </div>
    </div>
  );
}
