import { Link } from "react-router-dom";
import PublicLayout from "../components/layout/PublicLayout";

// Placeholder, renders /login page route component.
export default function LoginPage() {
  return (
    <PublicLayout>
      <h1>Login Page</h1>
      <Link to="/">Go Back</Link>
    </PublicLayout>
  );
}
