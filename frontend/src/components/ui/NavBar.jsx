// Sidebar navigation for logged-in pages. It reads logout from AuthProvider so
// the button clears token storage and the in-memory vault key together.
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/useAuth";

const NavBar = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const getClass = ({ isActive }) =>
    isActive ? "navbar__button active" : "navbar__button";

  function handleLogout() {
    // Clear auth/vault state first, then move the user back to the login page.
    logout();
    navigate("/login");
  }

  return (
    <nav className="navbar">
      <NavLink to="/vault" className={getClass}>
        All Passwords
      </NavLink>

      <NavLink to="/add-password" className={getClass}>
        Add Password
      </NavLink>

      <NavLink to="/guide" className={getClass}>
        Documentation
      </NavLink>

      <NavLink to="/account-settings" className={getClass}>
        Account Settings
      </NavLink>

      <button
        className="navbar__button"
        id="logout-button"
        type="button"
        onClick={handleLogout}
      >
        Logout
      </button>
    </nav>
  );
};

export default NavBar;
