// Provides the shared page frame for landing and auth pages.
import Logo from "../branding/Logo";
import Footer from "./Footer";

export default function PublicLayout({ children, showFooter = false }) {
  return (
    <div className="public-layout">
      <div className="public-layout__logo">
        <Logo />
      </div>

      <main className="public-layout__content">{children}</main>

      {showFooter ? <Footer /> : null}
    </div>
  );
}
