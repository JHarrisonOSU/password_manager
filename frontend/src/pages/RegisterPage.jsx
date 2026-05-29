import { Link } from "react-router-dom";
import PublicLayout from "../components/layout/PublicLayout";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { buildRegistrationPayload } from "../crypto/UserCrypto"
import { registerUser } from "../services/authService";

// Renders the /register page route.
export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordVerify, setPasswordVerify] = useState("")
  const navigate = useNavigate()
  const [error, setError] = useState(null);
  

  async function handleRegistrationSubmit(e) {
    e.preventDefault()
    
    if (password !== passwordVerify) {
      setError("Passwords do not match")
      return
    }

    try {
      const {serverPayload} = await buildRegistrationPayload(email, password)
      serverPayload['mfa_enabled'] = false
      
      // console.log(serverPayload) Can use this to demo that user's information is being hashed and payload object

      await registerUser(serverPayload)
      navigate('/login')
    } catch (err) {
      setError(err.message)
  }

  } 
  return (
    <PublicLayout logoPosition="center" showFooter={true}>
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
          {error ? (<p className="add-password-form__error">{error}</p>) : null}
          <p className="auth-page__footer">
            Already have an account?{" "}
            <Link to="/login">Click here to log in.</Link>
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}
