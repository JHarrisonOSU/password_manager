// App.jsx is the current top-level component for rest of app structure.
import Router from "./app/router";
import { useContext } from "react";
import { VaultContextProvider } from "./lib/VaultContext";

export default function App() {
  return (
    <VaultContextProvider>
      <Router />
    </VaultContextProvider>
  );
}
