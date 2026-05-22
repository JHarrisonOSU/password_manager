import { createContext } from "react";

// Keep the context object separate from the provider component so React Fast
// Refresh can treat VaultContext.jsx as a component-only module.
export const VaultKeyContext = createContext(null);
