// Map URL paths like /login and /register to page components.

import { Routes, Route } from "react-router-dom";
import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import GuidePage from "../pages/GuidePage";
import VaultPage from "../pages/VaultPage";
import AddPasswordPage from "../pages/AddPasswordPage";
import AccountSettingsPage from "../pages/AccountSettingsPage";

export default function Router() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/guide" element={<GuidePage />} />
      <Route path="/vault" element={<VaultPage />} />
      <Route path="/add-password" element={<AddPasswordPage />} />
      <Route path="/account-settings" element={<AccountSettingsPage />} />
    </Routes>
  );
}
