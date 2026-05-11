import { Link } from "react-router-dom";
import Logo from "../branding/Logo";
import Footer from "./Footer";

// Wrapper for public pages like landing, login, and register.
// Keeps those pages separate from the logged-in app navigation layout.
export default function PublicLayout({
  children,
  showFooter = false,
  logoPosition = "left",
}) {
  return (
    <div className="public-layout">
      <div
        className={`public-layout__logo public-layout__logo--${logoPosition}`}
      >
        <Link
          to="/"
          className={`public-layout__logo-link public-layout__logo-link--${logoPosition}`}
          aria-label="Go to landing page"
        >
          <Logo />
        </Link>
      </div>

      <main className="public-layout__content">{children}</main>

      {showFooter ? <Footer /> : null}
    </div>
  );
}
