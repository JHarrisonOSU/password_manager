// Small helper hook so components can read AuthProvider state without importing
// the raw context object directly.
import { useContext } from "react";
import { AuthContext } from "./AuthContextValue";

export function useAuth() {
  return useContext(AuthContext);
}
