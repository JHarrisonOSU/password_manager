// Owns app-level auth state: JWT token, current user info, and the in-memory
// vault key exposed by VaultKeyContext. Pages should use useAuth() instead of
// reading/writing localStorage directly.
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentUser, getSalt } from "../services/authService";
import { base64ToBuf, deriveLoginKeys } from "../crypto/UserCrypto";
import { AuthContext } from "./AuthContextValue";
import { VaultKeyContext } from "./VaultKeyContext";

export function AuthProvider({ children }) {
  // Keep the token in React state, seeded from localStorage on app load.
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);

  // The vault key stays in memory only, intentionally not persisted.
  const { vaultKey, setVaultKey, clearVault } = useContext(VaultKeyContext);

  const isAuthenticated = Boolean(token);
  const isVaultUnlocked = Boolean(vaultKey);

  // One shared logout path so navbar clicks, expired tokens, and route guards
  // all clear the same browser storage and in-memory vault state.
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("kdfParams");
    sessionStorage.removeItem("salt_enc");

    setToken(null);
    setUser(null);
    clearVault();
  }, [clearVault]);

  // When stored token exists, verify it with the backend and load /auth/me.
  // If the token is expired or invalid, clear the session.
  useEffect(() => {
    if (!token) {
      return;
    }

    let isActive = true;

    async function loadCurrentUser() {
      setIsLoadingUser(true);

      try {
        const currentUser = await getCurrentUser(token);

        if (isActive) {
          setUser(currentUser);
        }
      } catch (err) {
        console.error(err.message);

        if (isActive) {
          logout();
        }
      } finally {
        if (isActive) {
          setIsLoadingUser(false);
        }
      }
    }

    loadCurrentUser();

    // Prevent state updates if the provider unmounts before the request ends.
    return () => {
      isActive = false;
    };
  }, [token, logout]);

  // Called after LoginPage finishes password/MFA checks and decrypts the vault
  // key. This stores only the JWT and non-secret KDF metadata in browser storage.
  const login = useCallback(
    ({ token, vaultKey, kdfParams, saltEnc }) => {
      localStorage.setItem("token", token);
      sessionStorage.setItem("kdfParams", JSON.stringify(kdfParams));
      sessionStorage.setItem("salt_enc", JSON.stringify(Array.from(saltEnc)));

      setToken(token);
      setVaultKey(vaultKey);
    },
    [setVaultKey],
  );

  // Recreates the in-memory vault key after a refresh without storing that key
  // permanently. The user must re-enter their master password to unlock.
  const unlockVault = useCallback(
    async (masterPassword) => {
      if (!user?.email) {
        throw new Error("Current user is not loaded yet");
      }

      const data = await getSalt(user.email);
      const { encryption_key } = await deriveLoginKeys(
        masterPassword,
        data.salt_auth,
        data.salt_enc,
        data.kdf,
      );
      const unlockedVaultKey = await decryptVaultKey(
        encryption_key,
        data.encrypted_vault_key,
      );

      sessionStorage.setItem("kdfParams", JSON.stringify(data.kdf));
      sessionStorage.setItem("salt_enc", JSON.stringify(data.salt_enc));
      setVaultKey(unlockedVaultKey);

      return unlockedVaultKey;
    },
    [setVaultKey, user],
  );

  // Memoize the context value so consumers only rerender when auth state changes.
  const value = useMemo(
    () => ({
      token,
      user,
      vaultKey,
      isAuthenticated,
      isVaultUnlocked,
      isLoadingUser,
      login,
      logout,
      unlockVault,
    }),
    [
      token,
      user,
      vaultKey,
      isAuthenticated,
      isVaultUnlocked,
      isLoadingUser,
      login,
      logout,
      unlockVault,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

async function decryptVaultKey(encryptionKey, encryptedVaultKey) {
  const { iv, ciphertext } = encryptedVaultKey;
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encryptionKey,
    "AES-GCM",
    false,
    ["decrypt"],
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBuf(iv) },
    cryptoKey,
    base64ToBuf(ciphertext),
  );

  return new Uint8Array(decrypted);
}
