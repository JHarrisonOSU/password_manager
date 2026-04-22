import { Link } from "react-router-dom";
import PublicLayout from "../components/layout/PublicLayout";

// Renders the / (landing page) route.
export default function LandingPage() {
  return (
    <PublicLayout showFooter={true}>
      <div className="landing-page">
        <section className="landing-page__hero">
          <h1 className="landing-page__title">Secure Password Vault System</h1>
          <p className="landing-page__subtitle">
            Manage your passwords from one secure storage vault.
          </p>

          <div className="landing-page__actions">
            <Link className="landing-page__button" to="/login">
              Login
            </Link>
            <button
              className="landing-page__button landing-page__button--secondary"
              type="button"
            >
              How It Works
            </button>
          </div>
        </section>

        <section className="landing-page__info">
          <p>Text about technologies used</p>
        </section>
      </div>
    </PublicLayout>
  );
}
