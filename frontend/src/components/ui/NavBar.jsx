import { NavLink } from "react-router-dom"

const NavBar = () => {
  const getClass = ({ isActive }) =>
    isActive ? "navbar-button active" : "navbar-button"
  
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

      <button className="navbar-button" id="logout-button">
        Logout
      </button>
    </nav>
  )
}

export default NavBar