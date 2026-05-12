import { base64ToBuf, bufToBase64 } from "./UserCrypto";

export async function encryptEntry(entry, vaultKey) {
/** 
 * Encrypts a vault entry with AES-GCm using the provided vaultKey
 * 
 * The vault entry is serizlized to JSON, UTF-8 encoded, then encrypted with a randomly
 * generated initialization vector.
 * 
 * params: entry - plaintext vault entry (e.g. {site, username, password, notes})
 *         vaultKey - symmetric key
 * Both fields Base64-encoded. IV is non-secret and must be stored alongside with the ciphertext
 * and passed verbatim to decryptEntry
 * 
*/
  const iv  = crypto.getRandomValues(new Uint8Array(12));
  const key = await crypto.subtle.importKey(
    "raw", vaultKey, "AES-GCM", false, ["encrypt"]
  );
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(JSON.stringify(entry))
  );
  return {
    iv:         bufToBase64(iv),
    ciphertext: bufToBase64(ciphertext),
  };
}

export async function decryptEntry(encryptedEntry, vaultKey) {
/**
 * Decrypts and deserializes a single AES-GCM encrypted vault entry
 * 
 * params: encryptedEntry {iv, ciphertext} - the encrypted blob returned by encryptEntry
 *         vaultKey - key used during encryption
 * returns: Promise - the deserialized plaintext entry
 */
  const key = await crypto.subtle.importKey(
    "raw", vaultKey, "AES-GCM", false, ["decrypt"]
  );
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBuf(encryptedEntry.iv) },
    key,
    base64ToBuf(encryptedEntry.ciphertext)
  );
  return JSON.parse(new TextDecoder().decode(plaintext));
}

export async function decryptAllEntries(encryptedEntries, vaultKey) {
  return Promise.all(encryptedEntries.map(e => decryptEntry(e, vaultKey)));
}