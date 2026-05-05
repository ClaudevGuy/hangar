import { useCallback, useEffect, useRef, useState } from "react";
import { decryptJson, encryptJson, isEncryptedBlob, type EncryptedBlob } from "../lib/crypto";
import { workspaceKey } from "../lib/workspaces";
import type { SecretEntry, SecretsMap } from "../types";
import { notifyDataChanged } from "./useGistSync";

export type VaultState = "open" | "locked" | "unlocked";

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const ACTIVITY_EVENTS = ["mousedown", "keydown", "scroll"] as const;

const storageKey = () => workspaceKey("hangar-keys");

function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

interface UseVaultReturn {
  secrets: SecretsMap;
  state: VaultState;
  hasPassphrase: boolean;
  // Mutations
  upsertKey: (toolId: string, entry: Omit<SecretEntry, "id"> & { id?: string }) => void;
  removeKey: (toolId: string, keyId: string) => void;
  // Vault-level operations
  setPassphrase: (passphrase: string) => Promise<void>;
  changePassphrase: (current: string, next: string) => Promise<void>;
  removePassphrase: (current: string) => Promise<void>;
  unlock: (passphrase: string) => Promise<void>;
  lock: () => void;
  // Triggered by external sync — replace local secrets atomically.
  importSecrets: (next: SecretsMap) => Promise<void>;
}

function readRaw(): SecretsMap | EncryptedBlob | null {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return null;
    return JSON.parse(raw) as SecretsMap | EncryptedBlob;
  } catch {
    return null;
  }
}

export function useVault(): UseVaultReturn {
  const [secrets, setSecrets] = useState<SecretsMap>({});
  const [state, setState] = useState<VaultState>("open");
  // Passphrase held in memory only while unlocked.
  const passphraseRef = useRef<string | null>(null);
  // Cancelable persistence: a writes-in-flight token. We only commit the
  // most recent encrypt to avoid clobbering newer state with an older one.
  const writeTokenRef = useRef(0);
  // Idle auto-lock.
  const idleTimerRef = useRef<number | null>(null);

  // Initial read on mount + whenever the workspace changes (page reloads on
  // workspace switch so a single mount-time read is enough).
  useEffect(() => {
    const raw = readRaw();
    if (raw == null) {
      setSecrets({});
      setState("open");
      return;
    }
    if (isEncryptedBlob(raw)) {
      setSecrets({});
      setState("locked");
      return;
    }
    setSecrets(raw);
    setState("open");
  }, []);

  // Persist current secrets to localStorage. Encrypts when a passphrase is set.
  const persist = useCallback(async (next: SecretsMap): Promise<void> => {
    const myToken = ++writeTokenRef.current;
    if (passphraseRef.current) {
      const blob = await encryptJson(next, passphraseRef.current);
      // Only write if we're still the latest call.
      if (myToken === writeTokenRef.current) {
        localStorage.setItem(storageKey(), JSON.stringify(blob));
        notifyDataChanged();
      }
    } else {
      localStorage.setItem(storageKey(), JSON.stringify(next));
      notifyDataChanged();
    }
  }, []);

  // Mutations operate on the decrypted in-memory map. We only persist when
  // the vault is open or unlocked. (Locked = secrets is empty anyway, so
  // any mutation in that state is a no-op by construction.)
  const upsertKey = useCallback<UseVaultReturn["upsertKey"]>(
    (toolId, entry) => {
      setSecrets((prev) => {
        const list = prev[toolId] ?? [];
        const id = entry.id ?? newId();
        const idx = list.findIndex((k) => k.id === id);
        const item: SecretEntry = { id, label: entry.label, value: entry.value };
        const newList = idx >= 0 ? list.map((k, i) => (i === idx ? item : k)) : [...list, item];
        const next = { ...prev, [toolId]: newList };
        void persist(next);
        return next;
      });
    },
    [persist],
  );

  const removeKey = useCallback<UseVaultReturn["removeKey"]>(
    (toolId, keyId) => {
      setSecrets((prev) => {
        const list = prev[toolId];
        if (!list) return prev;
        const newList = list.filter((k) => k.id !== keyId);
        const next = { ...prev };
        if (newList.length === 0) delete next[toolId];
        else next[toolId] = newList;
        void persist(next);
        return next;
      });
    },
    [persist],
  );

  const importSecrets = useCallback<UseVaultReturn["importSecrets"]>(
    async (next) => {
      setSecrets(next);
      await persist(next);
    },
    [persist],
  );

  // Vault operations.
  const setPassphrase = useCallback(
    async (passphrase: string) => {
      if (passphrase.length === 0) throw new Error("Passphrase cannot be empty");
      const blob = await encryptJson(secrets, passphrase);
      localStorage.setItem(storageKey(), JSON.stringify(blob));
      passphraseRef.current = passphrase;
      setState("unlocked");
    },
    [secrets],
  );

  const unlock = useCallback(async (passphrase: string) => {
    const raw = readRaw();
    if (raw == null || !isEncryptedBlob(raw)) {
      throw new Error("No encrypted vault to unlock");
    }
    const decrypted = await decryptJson<SecretsMap>(raw, passphrase);
    passphraseRef.current = passphrase;
    setSecrets(decrypted);
    setState("unlocked");
  }, []);

  const lock = useCallback(() => {
    passphraseRef.current = null;
    setSecrets({});
    setState("locked");
  }, []);

  const changePassphrase = useCallback(
    async (current: string, next: string) => {
      if (state !== "unlocked") {
        await unlock(current);
      } else if (passphraseRef.current !== current) {
        // Confirm the current passphrase by attempting a decrypt round-trip.
        await unlock(current);
      }
      if (next.length === 0) throw new Error("New passphrase cannot be empty");
      const blob = await encryptJson(secrets, next);
      localStorage.setItem(storageKey(), JSON.stringify(blob));
      passphraseRef.current = next;
    },
    [secrets, state, unlock],
  );

  const removePassphrase = useCallback(
    async (current: string) => {
      if (state !== "unlocked") {
        await unlock(current);
      }
      passphraseRef.current = null;
      // Re-write plaintext so the vault is now in 'open' mode.
      localStorage.setItem(storageKey(), JSON.stringify(secrets));
      setState("open");
    },
    [secrets, state, unlock],
  );

  // Idle auto-lock — only relevant when unlocked.
  useEffect(() => {
    if (state !== "unlocked") return;
    const reset = () => {
      if (idleTimerRef.current != null) window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = window.setTimeout(lock, IDLE_TIMEOUT_MS);
    };
    reset();
    for (const ev of ACTIVITY_EVENTS) window.addEventListener(ev, reset);
    return () => {
      if (idleTimerRef.current != null) window.clearTimeout(idleTimerRef.current);
      for (const ev of ACTIVITY_EVENTS) window.removeEventListener(ev, reset);
    };
  }, [state, lock]);

  const hasPassphrase = state !== "open";

  return {
    secrets,
    state,
    hasPassphrase,
    upsertKey,
    removeKey,
    setPassphrase,
    changePassphrase,
    removePassphrase,
    unlock,
    lock,
    importSecrets,
  };
}
