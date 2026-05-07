import { argon2id } from "hash-wasm";

// KDF params — these get sent to the server at registration
// and fetched back at login so keys always re-derive identically
// KDF_PAarams are set based off recommendation from Open Worldwide Application Security Project (OWASP)
export const KDF_PARAMS = {
  iterations:  3,
  memorySize:  65536,  // 64 MB in KiB 
  parallelism: 1,
  hashLength:  32,
};

function createSalt() {
  // Creates an array of 8-bit unsigned integers
  return crypto.getRandomValues(new Uint8Array(16));
}

export function bufToBase64(buf) {
  // Helper function that returns an array of Base64 values of an ArrayBuffer
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

export function base64ToBuf(b64) {
  // Helper function that returns the ArrayBuffer of Base64 array
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

async function encryptVaultKey(vaultKey, encryptionKey) {
  /**
   * Encrpyts a vault key using AES_GCM with a provided encryption key.
   * This function takes sensitivte information (vaultKey) and encrypts it using AES-GCM with
   * a provided encrpytionKey. It generates a random initialization vector (iv) for each encryption to 
   * ensure uniquness and authenticity. 
   * 
   * params: vaultKey: the secret data to encrpyt
   *         encryptionKey: the key used to encryption. 
   * 
   * returns: An object containing:
   *          iv: the Base64-encoded initialization vector. MUST be unique per encryption - not secret
   *          cipherText: the Base64-encoded encrypted vault key, including the authentication tag - must be stored with iv to decrpyt
   *          }
   * encyptionKey must be kept secure - losing it means losing access to the vault key
   */
  const iv = crypto.getRandomValues(new Uint8Array(12)); // Generates random bytes
  const key = await crypto.subtle.importKey( 
    "raw",
    encryptionKey,  
    "AES-GCM",    // algorithm used
    false,        // boolean determining if the key is extractable from memory
    ["encrypt"]  
  );

  // ciphertext is an ArrayBuffer containing the encrypted vaultKey and the AES-GCM authentication tag
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, 
    key,
    vaultKey
  );

  return {
    iv:         bufToBase64(iv),    // bufToBase64 converts raw binary to readable Base64 string
    ciphertext: bufToBase64(ciphertext),
  };
}

export async function buildRegistrationPayload(email, password) {
  /**
   * Builds the registration payload for a new user in a zero-knowledge setup. 
   * 
   * This function generates all necessary client-side data for secure registration:
   * 1. Derives two keys from the user's passwor dusing Arogn2id:
   *  - auth_key: sent to server for login verifcation
   *  - encryption_key: used locally to encrypt the vault key
   * 2. Generates a random vault key for encrypting user data.
   * 3. Encrypts the vault_key with the password-derived encryption_key
   * 
   * params: email: user's email address
   *         password: user's master password
   * returns: 
   *    serverPayload: {
   *        email: string,
   *        salt_auth: number[],         - Byte array used to derive auth_key; stored server-side
   *        salt_enc:  number[],         - Byte array used to derive encryption_key; stored server-side
   *        auth_key:  string,           - Hex-encoded Argon2id hashed string; used for login verification
   *        kdf:       object,           - KDF parameters (iterations, memorySize, parallelism, hashLength)
   *        encrypted_vault_key: {
   *        iv:         string,        - Base64-encoded AES-GCM initialization vector
   *        ciphertext: string,        - Base64-encoded encrypted vault key + AES-GCM auth tag
   *        }
   *    },
   *    vaultKey: Uint8Array           - Raw 32-byte vault key; held in memory 
   */
  // Generate two independent salts (authentication and encryption) for key derivation
  const salt_auth = createSalt();
  const salt_enc  = createSalt();

  // auth_key — a hexidecimal string sent and stored in the server
  const auth_key = await argon2id({
    password,
    salt: salt_auth,
    ...KDF_PARAMS,
    outputType: "hex",
  });

  // encryption_key — binary string - this never leaves the browser
  const encryption_key = await argon2id({
    password,
    salt: salt_enc,
    ...KDF_PARAMS,
    outputType: "binary",
  });

  console.log("ENCRYPTION KEY", encryption_key)
  const vault_key = crypto.getRandomValues(new Uint8Array(32));
  const encrypted_vault_key = await encryptVaultKey(vault_key, encryption_key);

  return {
    serverPayload: {
      email,
      salt_auth: Array.from(salt_auth),   
      salt_enc: Array.from(salt_enc),
      auth_key,
      kdf: KDF_PARAMS,
      encrypted_vault_key,
    },
    vaultKey: vault_key,  // stays in memory, never sent to server
  };
}

export async function deriveLoginKeys(password, salt_auth, salt_enc, kdf) {
/**
 *  Re-derives the auth_key and encryption_key from the user's master password at login
 *  No key material stored on the server, so the client must re-derive both keys on every login
 *  using the salts and KDF parameters associated with the user.
 * 
 *  Returned auth_key is sent to the server for credential verification
 *  Returned encyption_key is used locally to decrypt the encrypted vault key
 *  
 *  params: password - the user's master password
 *          salt_auth - byte array retrieved from the server
 *          salt_enc - byte array retrieved from the server
 *          kdf - KDF parameters retrireved from the server; must match registration values 
 *                exactly or the derived keys will not match and login will fail
 * returns: auth_key - Hex-encoded Argon2id string
 *          encryption_key - raw key bytes used to decrypt the vault key locally
 * 
 */
  const [auth_key, encryption_key] = await Promise.all([
    argon2id({
      password,
      salt: new Uint8Array(salt_auth),
      iterations:  kdf.iterations,
      memorySize:  kdf.memorySize,
      parallelism: kdf.parallelism,
      hashLength:  kdf.hashLength,
      outputType:  "hex",
    }),
    argon2id({
      password,
      salt: new Uint8Array(salt_enc),
      iterations:  kdf.iterations,
      memorySize:  kdf.memorySize,
      parallelism: kdf.parallelism,
      hashLength:  kdf.hashLength,
      outputType:  "binary",
    }),
  ]);
  return { auth_key, encryption_key };
}