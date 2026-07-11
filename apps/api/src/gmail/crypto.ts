function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

async function importAesKey(keyB64: string): Promise<CryptoKey> {
  const keyBytes = base64ToBytes(keyB64);
  if (keyBytes.length !== 32) {
    throw new Error(
      "GMAIL_TOKEN_ENCRYPTION_KEY must be 32 bytes (base64-encoded)",
    );
  }
  return crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encryptSecret(
  plaintext: string,
  keyB64: string,
): Promise<string> {
  const key = await importAesKey(keyB64);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded,
  );
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return bytesToBase64(combined);
}

export async function decryptSecret(
  payloadB64: string,
  keyB64: string,
): Promise<string> {
  const key = await importAesKey(keyB64);
  const combined = base64ToBytes(payloadB64);
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext,
  );
  return new TextDecoder().decode(decrypted);
}

async function importHmacKey(keyB64: string): Promise<CryptoKey> {
  const keyBytes = base64ToBytes(keyB64);
  return crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signState(
  payload: string,
  keyB64: string,
): Promise<string> {
  const key = await importHmacKey(keyB64);
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  return bytesToBase64(new Uint8Array(sig));
}

export async function verifyState(
  payload: string,
  signature: string,
  keyB64: string,
): Promise<boolean> {
  const key = await importHmacKey(keyB64);
  const sigBytes = base64ToBytes(signature);
  return crypto.subtle.verify(
    "HMAC",
    key,
    sigBytes,
    new TextEncoder().encode(payload),
  );
}
