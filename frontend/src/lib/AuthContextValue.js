// Raw React context for auth state.

// This file intentionally exports only the context object. AuthProvider and
// useAuth live in separate modules so React Fast Refresh can reload component
// files without mixed exports warning.
import { createContext } from "react";

export const AuthContext = createContext(null);
