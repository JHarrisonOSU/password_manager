// Context.js
import { useState, createContext } from "react";

export const VaultKeyContext = createContext(null);

export const VaultContextProvider = ({ children }) => {
    const [vaultKey, setVaultKey] = useState(null)
    const clearVault = () => setVaultKey(null) // Removes vaultKey on logout

    return (
        <VaultKeyContext.Provider value={{ vaultKey, setVaultKey, clearVault }}>
            {children}
        </VaultKeyContext.Provider>
    )
}

