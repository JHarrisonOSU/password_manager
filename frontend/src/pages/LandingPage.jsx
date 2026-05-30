import { Link } from "react-router-dom";
import PublicLayout from "../components/layout/PublicLayout";
import PasswordBeforeAfter from "../components/branding/PasswordBeforeAfter";
import Features from "../components/layout/Features";

// Renders the / (landing page) route.
export default function LandingPage() {
  function scrollToInfoSection() {
    document
      .querySelector(".landing-page__info")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <PublicLayout showFooter={true} logoPosition="left">
      <div className="landing-page">
        <section className="landing-page__hero">
          <h1 className="landing-page__title">
            Where your{" "}
            <span className="landing-page__title-highlight landing-page__title-highlight--data">
              data
            </span>{" "}
            meets{" "}
            <span className="landing-page__title-highlight landing-page__title-highlight--security">
              security
            </span>
          </h1>
          <p className="landing-page__subtitle">
            Protect your passwords in a secure vault locked by a master password that never leaves your browser.
          </p>
          <PasswordBeforeAfter />
          <div className="landing-page__actions">
            <Link className="landing-page__button" to="/register">
              Get Started
            </Link>
            <button
              className="landing-page__button"
              type="button"
              onClick={scrollToInfoSection}
            >
              Learn More
            </button>
          </div>
        </section>

        <section className="landing-page__info">
          <h1 className="landing-page__section-title">Features</h1>
          <p>Built Around Keeping Your Data Safe</p>
          <Features />
        </section>
      </div>
    </PublicLayout>
  );
}
