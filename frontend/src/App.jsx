// Top-level app composition. VaultContextProvider must wrap AuthProvider
// because AuthProvider stores/clears the in-memory vault key during login/logout.
import Router from "./app/router";
import { VaultContextProvider } from "./lib/VaultContext";
import { AuthProvider } from "./lib/AuthContext";

export default function App() {
  return (
    <VaultContextProvider>
      <AuthProvider>
        <Router />
      </AuthProvider>
    </VaultContextProvider>
  );
}
