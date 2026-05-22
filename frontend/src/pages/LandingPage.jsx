import { Link } from "react-router-dom";
import PublicLayout from "../components/layout/PublicLayout";
import PasswordBeforeAfter from "../components/branding/PasswordBeforeAfter";
import Features from "../components/layout/Features";

// Renders the / (landing page) route.
export default function LandingPage() {
  return (
    <PublicLayout showFooter={true} logoPosition="left">
      <div className="landing-page">
        <section className="landing-page__hero">
          <h1 className="landing-page__title">Where your <span style={{color:"white", fontWeight:"500"}}>data</span> meets <span style={{color:"#2ECC71", fontWeight:"500"}}>security</span></h1>
          <p className="landing-page__subtitle">
            Protect your passwords in a secure vault locked by a master password that never leaves your browser.
          </p>
          <PasswordBeforeAfter/>
          <div className="landing-page__actions">
            <Link className="landing-page__button" to="/register">
              Get Started
            </Link>
            <button
              className="landing-page__button "
              type="button"
              onClick={() => document.getElementsByClassName('landing-page__info')[0]?.scrollIntoView({behavior: 'smooth'})}
            >
              Learn More
            </button>
          </div>
        </section>

        <section className="landing-page__info">
          <h1 style={{marginBottom:"0px"}}>Features</h1>
          <p>Built Around Keeping Your Data Safe</p>
            <Features/>

        </section>
      </div>
    </PublicLayout>
  );
}
