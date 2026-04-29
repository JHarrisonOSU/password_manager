import { Link } from "react-router-dom";
import PublicLayout from "../components/layout/PublicLayout";
import { useState } from "react";
import buildRegistrationPayload from "../crypto/utilities.jsx"
import { useNavigate } from "react-router-dom";
// Renders the /register page route.
export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordVerify, setPasswordVerify] = useState("")
  const [hashedPassword, setHashedPassword] = useState("")
  const navigate = useNavigate()
  async function handleRegistrationSubmit(e) {
    e.preventDefault()
    
    if (password !== passwordVerify) {
      console.log("Passwords do not match")
      return
    }

    try {
      // const serverPayload = await buildRegistrationPayload(email, password)
      const serverPayload = {
        email,
        master_password: password,
        mfa_enabled: false
      }
      const response = await fetch("http://127.0.0.1:8000/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(serverPayload)
      })
      // const data = await response.json()
      // console.log(response)
      navigate('/guide')
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
