// Wraps authenticated pages. A valid token can open the app shell; the vault
// key can be restored later by prompting for the master password when needed.
import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/useAuth";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoadingUser } = useAuth();

  if (isLoadingUser) {
    return null;
  }

  // No token means the user has not logged in during this browser session.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
