// Web Crypto wrapper: PBKDF2-derived AES-GCM. All output is base64 strings
// so it survives JSON.stringify into localStorage.
//
// Threat model: a curious user opening DevTools should NOT see your tokens
// in plaintext localStorage. They DO know the encryption format and can
// brute-force a weak passphrase — pick a real one. Auto-lock-on-idle clears
// the in-memory key so subsequent reads need re-unlock.

const PBKDF2_ITERATIONS = 200_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;

export interface EncryptedBlob {
  __encrypted: true;
  v: 1;
  // base64
  salt: string;
  iv: string;
  ciphertext: string;
}

function toB64(buf: ArrayBuffer | Uint8Array): string {
  const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < u8.byteLength; i++) s += String.fromCharCode(u8[i]);
  return btoa(s);
}

function fromB64(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptJson<T>(plain: T, passphrase: string): Promise<EncryptedBlob> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(passphrase, salt);
  const enc = new TextEncoder();
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    enc.encode(JSON.stringify(plain)),
  );
  return {
    __encrypted: true,
    v: 1,
    salt: toB64(salt),
    iv: toB64(iv),
    ciphertext: toB64(ct),
  };
}

export async function decryptJson<T>(blob: EncryptedBlob, passphrase: string): Promise<T> {
  const salt = fromB64(blob.salt);
  const iv = fromB64(blob.iv);
  const ct = fromB64(blob.ciphertext);
  const key = await deriveKey(passphrase, salt);
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    ct as BufferSource,
  );
  const dec = new TextDecoder();
  return JSON.parse(dec.decode(plain)) as T;
}

export function isEncryptedBlob(value: unknown): value is EncryptedBlob {
  return (
    !!value &&
    typeof value === "object" &&
    (value as EncryptedBlob).__encrypted === true &&
    typeof (value as EncryptedBlob).salt === "string" &&
    typeof (value as EncryptedBlob).iv === "string" &&
    typeof (value as EncryptedBlob).ciphertext === "string"
  );
}
