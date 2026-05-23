// Wraps authenticated pages and redirects users who cannot safely open the
// vault. A JWT alone is not enough because refreshes erase the in-memory key.
import { Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../lib/useAuth";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isVaultUnlocked, isLoadingUser, logout } = useAuth();
  // This catches the refresh case (token still exists, but vault key is gone)
  const shouldResetSession =
    !isLoadingUser && isAuthenticated && !isVaultUnlocked;

  // Logout changes state/storage, so do it in an effect instead of during render.
  useEffect(() => {
    if (shouldResetSession) {
      logout();
    }
  }, [shouldResetSession, logout]);

  if (isLoadingUser) {
    return null;
  }

  // No token means the user has not logged in during this browser session.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Token without vault key cannot decrypt vault data, so restart login.
  if (shouldResetSession) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
