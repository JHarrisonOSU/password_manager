import { Link } from "react-router-dom";
import PublicLayout from "../components/layout/PublicLayout";

// Placeholder, renders /register page route component.
export default function RegisterPage() {
  return (
    <PublicLayout>
      <h1>Register Page</h1>
      <Link to="/">Go Back</Link>
    </PublicLayout>
  );
}
