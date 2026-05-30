import { Link } from "react-router-dom";

// Shared footer for public pages. Keeps the landing page feeling complete
// without adding another large marketing section.
export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <p className="site-footer__name">Password Protector</p>
          <p className="site-footer__tagline">
            Secure password storage with client-side encryption.
          </p>
        </div>

        <nav className="site-footer__nav" aria-label="Footer navigation">
          <Link to="/">Home</Link>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </nav>

        <div className="site-footer__meta">
          <p>React - FastAPI - Supabase</p>
          <p>&copy; 2026 Password Protector</p>
        </div>
      </div>
    </footer>
  );
}
