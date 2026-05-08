// RepoScanModal — guides the user through picking a project directory,
// scanning package.json + .env files, and adopting findings (pin tools,
// import env values to the vault). Local-first: nothing leaves the browser.

import { useState } from "react";
import { Icon } from "../lib/icons";
import {
  isFileSystemAccessSupported,
  pickDirectory,
  scanRepo,
  type ScanFinding,
  type ScanResult,
} from "../lib/repoScanner";
import type { SecretEntry, Tool } from "../types";
import { ToolLogo } from "./ToolLogo";

interface Props {
  // The full tool catalog (built-in + custom) so we can resolve ids → Tool.
  allTools: Tool[];
  // Currently-pinned ids; pre-checks that don't get re-pinned.
  stack: string[];
  onPin: (toolId: string) => void;
  onImportKey: (toolId: string, entry: Omit<SecretEntry, "id">) => void;
  onClose: () => void;
}

// What the user has selected within a finding's controls.
interface Selection {
  pin: boolean;
  envs: Set<string>; // env var names selected for import
}

export function RepoScanModal({ allTools, stack, onPin, onImportKey, onClose }: Props) {
  const [phase, setPhase] = useState<"idle" | "scanning" | "results" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [selections, setSelections] = useState<Map<string, Selection>>(new Map());
  const [adoptedSummary, setAdoptedSummary] = useState<{ pinned: number; keys: number } | null>(
    null,
  );

  const supported = isFileSystemAccessSupported();

  const startScan = async () => {
    setError(null);
    try {
      const handle = await pickDirectory();
      if (!handle) return; // user cancelled
      setPhase("scanning");
      const r = await scanRepo(handle);
      setResult(r);
      // Default selections: pin every finding that isn't already pinned;
      // import every env var that has a non-empty value.
      const sel = new Map<string, Selection>();
      for (const f of r.findings) {
        sel.set(f.toolId, {
          pin: !stack.includes(f.toolId),
          envs: new Set(f.envVars.filter((e) => e.value.length > 0).map((e) => e.name)),
        });
      }
      setSelections(sel);
      setPhase("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't scan the directory");
      setPhase("idle");
    }
  };

  const toggle = (toolId: string, mut: (s: Selection) => Selection) => {
    setSelections((prev) => {
      const next = new Map(prev);
      const cur = next.get(toolId) ?? { pin: false, envs: new Set() };
      next.set(toolId, mut(cur));
      return next;
    });
  };

  const adopt = () => {
    if (!result) return;
    let pinned = 0;
    let keys = 0;
    for (const f of result.findings) {
      const sel = selections.get(f.toolId);
      if (!sel) continue;
      if (sel.pin && !stack.includes(f.toolId)) {
        onPin(f.toolId);
        pinned++;
      }
      for (const env of f.envVars) {
        if (!sel.envs.has(env.name)) continue;
        if (!env.value) continue; // empty (.example) — never imported
        onImportKey(f.toolId, { label: env.name, value: env.value });
        keys++;
      }
    }
    setAdoptedSummary({ pinned, keys });
    setPhase("done");
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="repo-scan-modal" onClick={(e) => e.stopPropagation()}>
        <header className="compare-head">
          <h2>
            Scan repo{" "}
            <span className="muted">
              {result
                ? `· ${result.rootName} · ${result.findings.length} ${result.findings.length === 1 ? "tool" : "tools"} detected`
                : "· read package.json + .env"}
            </span>
          </h2>
          <button type="button" className="drawer-x" onClick={onClose}>
            <Icon.close />
          </button>
        </header>

        <div className="repo-scan-body">
          {!supported && (
            <div className="repo-scan-empty">
              <div className="empty-big">Browser not supported</div>
              <p className="muted">
                Repo scanning uses the File System Access API, which is currently only available in
                Chromium browsers (Chrome, Edge, Brave, Arc, Opera). Try one of those to use this
                feature.
              </p>
            </div>
          )}

          {supported && phase === "idle" && (
            <div className="repo-scan-intro">
              <p className="repo-scan-blurb">
                Pick a project directory. Hangar reads <code>package.json</code> and any{" "}
                <code>.env</code> / <code>.env.local</code> files at the root, infers which Hangar
                tools the project uses, and surfaces optional env values for one-click vault
                import.
              </p>
              <ul className="repo-scan-promises">
                <li><Icon.check /> Read-only — Hangar never writes to your disk</li>
                <li><Icon.check /> Local-first — nothing is uploaded anywhere</li>
                <li><Icon.check /> Per-pick permission — granted only for this scan</li>
              </ul>
              <button type="button" className="primary-btn" onClick={startScan}>
                Pick a directory
              </button>
              {error && <div className="repo-scan-error">{error}</div>}
            </div>
          )}

          {phase === "scanning" && (
            <div className="repo-scan-empty">
              <div className="empty-big">Scanning…</div>
              <p className="muted">Reading package.json and .env files at the directory root.</p>
            </div>
          )}

          {phase === "results" && result && (
            <ResultsView
              result={result}
              allTools={allTools}
              stack={stack}
              selections={selections}
              toggle={toggle}
              onAdopt={adopt}
              onCancel={onClose}
            />
          )}

          {phase === "done" && adoptedSummary && (
            <div className="repo-scan-empty">
              <div className="empty-big">Stack updated</div>
              <p className="muted">
                Pinned {adoptedSummary.pinned}{" "}
                {adoptedSummary.pinned === 1 ? "tool" : "tools"} · imported {adoptedSummary.keys}{" "}
                {adoptedSummary.keys === 1 ? "key" : "keys"} into the vault.
              </p>
              <button type="button" className="primary-btn" onClick={onClose}>
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ResultsProps {
  result: ScanResult;
  allTools: Tool[];
  stack: string[];
  selections: Map<string, Selection>;
  toggle: (toolId: string, mut: (s: Selection) => Selection) => void;
  onAdopt: () => void;
  onCancel: () => void;
}

function ResultsView({
  result, allTools, stack, selections, toggle, onAdopt, onCancel,
}: ResultsProps) {
  if (result.findings.length === 0) {
    return (
      <div className="repo-scan-empty">
        <div className="empty-big">No tools detected</div>
        <p className="muted">
          Couldn't match anything in the package.json deps or .env vars to a tool in the catalog.
          You can still use the rest of Hangar normally.
        </p>
        <button type="button" className="ghost-btn" onClick={onCancel}>
          Close
        </button>
      </div>
    );
  }

  // Build the "adopt all" summary line.
  const totalPin = Array.from(selections.values()).filter((s) => s.pin).length;
  const totalKeys = Array.from(selections.values()).reduce((sum, s) => sum + s.envs.size, 0);

  return (
    <>
      <ul className="repo-scan-list">
        {result.findings.map((f) => (
          <FindingRow
            key={f.toolId}
            finding={f}
            tool={allTools.find((t) => t.id === f.toolId)}
            alreadyPinned={stack.includes(f.toolId)}
            selection={selections.get(f.toolId) ?? { pin: false, envs: new Set() }}
            toggle={(mut) => toggle(f.toolId, mut)}
          />
        ))}
      </ul>
      <footer className="repo-scan-foot">
        <div className="muted">
          Adopting: {totalPin} {totalPin === 1 ? "pin" : "pins"} · {totalKeys}{" "}
          {totalKeys === 1 ? "key" : "keys"}
        </div>
        <div className="repo-scan-foot-actions">
          <button type="button" className="ghost-btn" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="primary-btn"
            onClick={onAdopt}
            disabled={totalPin === 0 && totalKeys === 0}
          >
            Adopt selection
          </button>
        </div>
      </footer>
    </>
  );
}

interface FindingRowProps {
  finding: ScanFinding;
  tool: Tool | undefined;
  alreadyPinned: boolean;
  selection: Selection;
  toggle: (mut: (s: Selection) => Selection) => void;
}

function FindingRow({ finding, tool, alreadyPinned, selection, toggle }: FindingRowProps) {
  const importableEnvs = finding.envVars.filter((e) => e.value.length > 0);

  return (
    <li className="repo-scan-finding">
      <div className="repo-scan-finding-head">
        {tool ? (
          <ToolLogo tool={tool} size={32} />
        ) : (
          <div className="repo-scan-unknown">{finding.toolId.slice(0, 1).toUpperCase()}</div>
        )}
        <div className="repo-scan-finding-meta">
          <div className="repo-scan-finding-name">
            {tool?.name ?? finding.toolId}
            {alreadyPinned && <span className="repo-scan-pill">already pinned</span>}
          </div>
          <div className="repo-scan-finding-reasons">{finding.reasons.join(" · ")}</div>
        </div>
        <label className="repo-scan-toggle">
          <input
            type="checkbox"
            checked={selection.pin && !alreadyPinned}
            disabled={alreadyPinned}
            onChange={(e) => toggle((s) => ({ ...s, pin: e.target.checked }))}
          />
          <span>{alreadyPinned ? "pinned" : "pin"}</span>
        </label>
      </div>
      {importableEnvs.length > 0 && (
        <ul className="repo-scan-envs">
          {importableEnvs.map((env) => {
            const checked = selection.envs.has(env.name);
            return (
              <li key={env.name}>
                <label className="repo-scan-toggle">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const want = e.target.checked;
                      toggle((s) => {
                        const envs = new Set(s.envs);
                        if (want) envs.add(env.name);
                        else envs.delete(env.name);
                        return { ...s, envs };
                      });
                    }}
                  />
                  <span className="repo-scan-env-name">{env.name}</span>
                  <span className="repo-scan-env-mask">
                    {"•".repeat(Math.min(20, Math.max(8, env.value.length)))}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}
