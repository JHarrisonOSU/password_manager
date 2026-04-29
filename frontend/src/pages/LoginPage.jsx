import { Link } from "react-router-dom";
import PublicLayout from "../components/layout/PublicLayout";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
// Renders the /login page route.
export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()
  async function handleLoginSubmit(e) {
    e.preventDefault()
    try {
      const serverPayload = {
        email: email, 
        master_password: password}

      const response = await fetch("http://127.0.0.1:8000/auth/login", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(serverPayload)
      })
      const data = await response.json();

      const token = data.access_token
      localStorage.setItem("token", token)
        
      console.log(data)
      navigate("/guide")
    } catch (err) {
      console.error(err.message)
    }
  }

  return (
    <PublicLayout logoPosition="center">
      <section className="auth-page">
        <div className="auth-page__card">
          <h1 className="auth-page__title">Sign in to Password Protector</h1>

          <form className="auth-page__form" onSubmit={handleLoginSubmit}>
            <label className="auth-page__field">
              <span>Email:</span>
              <input
                className="auth-page__input"
                type="email"
                name="email"
                placeholder=""
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label className="auth-page__field">
              <span>Password:</span>
              <input
                className="auth-page__input"
                type="password"
                name="password"
                placeholder=""
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            <button className="auth-page__button" type="submit" 
                >
              Sign In
            </button>
          </form>

          <p className="auth-page__footer">
            Don’t have an account?{" "}
            <Link to="/register">Click here to register.</Link>
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}
