import { data, Link } from "react-router-dom";
import PublicLayout from "../components/layout/PublicLayout";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { argon2id } from "hash-wasm";
import { base64ToBuf } from "../crypto/UserCrypto";
import authAPI from "../services/authService";

// Renders the /login page route.
export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()

  async function handleLoginSubmit(e) {
    e.preventDefault()
    try {
      // 1. Fetch salts
      const saltsResponse = await fetch(`${authAPI}salt?email=${email}`);
      const data =  await saltsResponse.json()
      const salt_auth = new Uint8Array(data.salt_auth)
      const salt_enc = new Uint8Array(data.salt_enc)

      // 2. Derive keys
      const auth_key = await argon2id({
        password,
        salt: salt_auth,
        ...data.kdf,
        outputType: "hex"
      });
      const encryption_key = await argon2id({
        password,
        salt: salt_enc,
        ...data.kdf,
        outputType: "binary"
      })

      // 3. Send login request
      const loginResponse = await fetch(`${authAPI}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, auth_key }),
      })
      const loginData = await loginResponse.json()

      // 4. Decrypt the vault key locally - encryption key never left the browser
      const { iv, ciphertext } = loginData.encrypted_vault_key
      const cryptoKey = await crypto.subtle.importKey(
        "raw", encryption_key, "AES-GCM", false, ["decrypt"]
      );
      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: base64ToBuf(iv) },
        cryptoKey,
        base64ToBuf(ciphertext)
      );
      // **TODO: How to manage the vaultKey without storing it in the browser? Pass it up in react context?
      const vaultKey = new Uint8Array(decrypted)

      const token = loginData.access_token
      localStorage.setItem("token", token)
        
      navigate("/vault")
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
