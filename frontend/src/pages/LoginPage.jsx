import { data, Link } from "react-router-dom";
import PublicLayout from "../components/layout/PublicLayout";
import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { argon2id } from "hash-wasm";
import { base64ToBuf } from "../crypto/UserCrypto";
import authAPI from "../services/authService";
import { VaultKeyContext } from "../lib/VaultContext";
import TotpInput from "../components/forms/TOTPInput"
// Renders the /login page route.
export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()
  const [showErrorMsg, setShowErrorMsg] = useState(false)
  const [showTotp, setShowTotp] = useState(false)
  const [resolver, setResolver] = useState(null);

  const {setVaultKey} = useContext(VaultKeyContext)
  
  async function handleLoginSubmit(e) {
    let authData = null
    e.preventDefault()
    try {
      // 1. Fetch salts
      const {salt_auth, salt_enc, kdfParams} = await fetchSalts()

      // 2. Derive keys
      const {auth_key, encryption_key} = await deriveKeys(salt_auth, salt_enc, kdfParams)

      // 3. Send login request
      const loginResponse = await fetch(`${authAPI}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, auth_key }),
      })
      const loginData = await loginResponse.json()

      if (loginData.token_type == "pre_auth") {
        const code = await waitForInput();

        const mfaResponse = await fetch(`${authAPI}/mfa/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pre_auth_token: loginData.access_token, 
            code: code 
          })
        });

        if (!mfaResponse.ok) {
          throw new Error("Invalid Credentials")
        }
        
        authData = await mfaResponse.json()
      } else if (loginData.token_type == "bearer") {
        authData = loginData
      } else {
        throw new Error("Unknown token type")
      }
      if (!loginResponse.ok) {
        throw new Error("Invalid Credentials")
      }

      const vaultKey = await decryptVaultKey(encryption_key, authData)
      setVaultKey(vaultKey)

      const token = authData.access_token
      localStorage.setItem("token", token)
      sessionStorage.setItem("kdfParams", JSON.stringify(kdfParams))
      sessionStorage.setItem("salt_enc", JSON.stringify(Array.from(salt_enc)));
      navigate("/vault")
    } catch (err) {
      setShowErrorMsg(true)
      console.error(err.message)
    }
  }

  async function fetchSalts() {
      const saltsResponse = await fetch(`${authAPI}/salt?email=${encodeURIComponent(email)}`);
      const data =  await saltsResponse.json()
      let salt_auth = new Uint8Array(data.salt_auth)
      let salt_enc = new Uint8Array(data.salt_enc)
      let kdfParams = data.kdf
      return {salt_auth, salt_enc, kdfParams}
  }

  async function deriveKeys(salt_auth, salt_enc, kdfParams) {
    const auth_key = await argon2id({
      password,
      salt: salt_auth,
      ...kdfParams,
      outputType: "hex"
    });
    const encryption_key = await argon2id({
      password,
      salt: salt_enc,
      ...kdfParams,
      outputType: "binary"
    })
    return {auth_key, encryption_key}
  }

  async function decryptVaultKey(encryption_key, response) {
    const {iv, ciphertext} = response.encrypted_vault_key
    const cryptoKey = await crypto.subtle.importKey(
      "raw", encryption_key, "AES-GCM", false, ["decrypt"]
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64ToBuf(iv) },
      cryptoKey,
      base64ToBuf(ciphertext)
    );
    const vaultKey = new Uint8Array(decrypted)
    return vaultKey
  }

  const waitForInput = () => {
    setShowTotp(true)
    return new Promise((resolve) => {
      setResolver(() => resolve);
    });
  };

  const handleTotpSubmit = (code) => {
    if (resolver) {
      resolver(code);
    }
    setResolver(null);
    setShowTotp(false);
  };

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
          {showTotp && (
            <TotpInput onSubmit={handleTotpSubmit} />
          )}
          {showErrorMsg && <p className="">Invalid email or password</p>}
          <p className="auth-page__footer">
            Don’t have an account?{" "}
            <Link to="/register">Click here to register.</Link>
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}
