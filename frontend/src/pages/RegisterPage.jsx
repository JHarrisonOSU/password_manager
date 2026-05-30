import { Link, useNavigate } from "react-router-dom";
import PublicLayout from "../components/layout/PublicLayout";
import { useState } from "react";
import { buildRegistrationPayload } from "../crypto/UserCrypto";
import { registerUser } from "../services/authService";

// Renders the /register page route.
export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVerify, setPasswordVerify] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleRegistrationSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email || !password || !passwordVerify) {
      setError("Please fill out every field.");
      return;
    }

    if (password !== passwordVerify) {
      setError("Passwords do not match.");
      return;
    }

    const passwordError = getPasswordValidationError(password);

    if (passwordError) {
      setError(passwordError);
      return;
    }

    try {
      setIsSubmitting(true);
      // buildRegistrationPayload handles the client-side salt/key/vault setup.
      const { serverPayload } = await buildRegistrationPayload(email, password);
      serverPayload.mfa_enabled = false;

      await registerUser(serverPayload);
      navigate("/login");
    } catch (err) {
      setError(err.message || "Unable to create account.");
    } finally {
      setIsSubmitting(false);
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
                value={email}
                disabled={isSubmitting}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label className="auth-page__field">
              <span>Password:</span>
              <input
                className="auth-page__input"
                type="password"
                name="password"
                value={password}
                disabled={isSubmitting}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            <label className="auth-page__field">
              <span>Re-enter Password:</span>
              <input
                className="auth-page__input"
                type="password"
                name="confirmPassword"
                value={passwordVerify}
                disabled={isSubmitting}
                onChange={(e) => setPasswordVerify(e.target.value)}
              />
            </label>

            <button
              className="auth-page__button"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating Account..." : "Register"}
            </button>
          </form>
          {error ? (
            <p className="auth-page__message auth-page__message--error">
              {error}
            </p>
          ) : null}
          <p className="auth-page__footer">
            Already have an account?{" "}
            <Link to="/login">Click here to log in.</Link>
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}

function getPasswordValidationError(password) {
  // Keep the master password rules clear because this password protects the vault key.
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  if (
    password.length < 8 ||
    !hasUppercase ||
    !hasLowercase ||
    !hasNumber ||
    !hasSymbol
  ) {
    return "Password must be at least 8 characters and include uppercase, lowercase, number, and symbol.";
  }

  return "";
}
