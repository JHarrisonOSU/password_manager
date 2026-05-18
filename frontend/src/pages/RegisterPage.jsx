import { Link } from "react-router-dom";
import PublicLayout from "../components/layout/PublicLayout";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { buildRegistrationPayload } from "../crypto/UserCrypto"
import authAPI from "../services/authService";

// Renders the /register page route.
export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordVerify, setPasswordVerify] = useState("")
  const navigate = useNavigate()
  async function handleRegistrationSubmit(e) {
    e.preventDefault()
    
    if (password !== passwordVerify) {
      console.log("Passwords do not match")
      return
    }

    try {
      const {serverPayload, vaultKey} = await buildRegistrationPayload(email, password)
      serverPayload['mfa_enabled'] = false
      
      // console.log(serverPayload) Can use this to demo that user's information is being hashed and payload object

      const response = await fetch(`${authAPI}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(serverPayload)
      })

      if (!response.ok) {
      const data = await response.json();
      throw new Error(data.detail || "Registration failed");
      }

      const data = await response.json()
      
      navigate('/login')
    } catch (err) {
        console.error(err.message)
  }

  } 
  return (
    <PublicLayout logoPosition="center">
      <section className="auth-page">
        <div className="auth-page__card">
          <h1 className="auth-page__title">Create An Account:</h1>

          <form className="auth-page__form" onSubmit={handleRegistrationSubmit}>
            <label className="auth-page__field">
              <span>Email:</span>
              <input 
                className="auth-page__input" 
                type="email" 
                name="email" 
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label className="auth-page__field">
              <span>Password:</span>
              <input
                className="auth-page__input"
                type="password"
                name="password"
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            <label className="auth-page__field">
              <span>Re-enter Password:</span>
              <input
                className="auth-page__input"
                type="password"
                name="confirmPassword"
                onChange={(e) => setPasswordVerify(e.target.value)}
              />
            </label>

            <button className="auth-page__button" type="submit" >
              Register
            </button>
          </form>

          <p className="auth-page__footer">
            Already have an account?{" "}
            <Link to="/login">Click here to log in.</Link>
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}
