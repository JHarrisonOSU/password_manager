import { Link } from "react-router-dom";
import Logo from "../branding/Logo";
import NavBar from "../ui/NavBar";

// Wrapper for logged-in app pages like vault, add password, and settings.
// Provides the shared logo, navbar, and main content area.
// Possible TODO: Add protected route logic to redirect to login if not authenticated?
export default function AppShell({ children }) {
  return (
    <div className="app-shell">
      <aside className="app-shell__sidebar">
        <Link to="/" className="app-shell__logo-link" aria-label="Go to landing page">
          <Logo />
        </Link>

        <NavBar />
      </aside>

      <main className="app-shell__content">{children}</main>
    </div>
  );
}
