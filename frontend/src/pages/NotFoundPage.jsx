import { Link } from "react-router-dom";
import PublicLayout from "../components/layout/PublicLayout";

export default function NotFoundPage() {
  return (
    <PublicLayout logoPosition="center">
      <section className="not-found-page">
        <div className="not-found-page__content">
          <p className="not-found-page__eyebrow">404</p>
          <h1>Page Not Found</h1>
          <p>
            The page you are looking for does not exist or may have been moved.
          </p>

          <Link className="not-found-page__button" to="/">
            Go Home
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
