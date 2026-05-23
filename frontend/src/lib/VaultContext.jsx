// Provides the in-memory vault key used to decrypt saved password entries.
// The key is not persisted; users must log in again after a full page refresh.
import { useState } from "react";
import { VaultKeyContext } from "./VaultKeyContext";

export const VaultContextProvider = ({ children }) => {
    const [vaultKey, setVaultKey] = useState(null)
    const clearVault = () => setVaultKey(null) // Removes vaultKey on logout.

    return (
        <VaultKeyContext.Provider value={{ vaultKey, setVaultKey, clearVault }}>
            {children}
        </VaultKeyContext.Provider>
    )
}
