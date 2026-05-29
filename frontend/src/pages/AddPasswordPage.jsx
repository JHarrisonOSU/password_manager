import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import UnlockVaultModal from "../components/forms/UnlockVaultModal";
import { encryptEntry } from "../crypto/VaultCrypto";
import { useAuth } from "../lib/useAuth";
import { createVaultItem } from "../services/authService";

const initialFormData = {
  accountLogin: "",
  website: "",
  password: "",
  verifyPassword: "",
  notes: "",
};

export default function AddPasswordPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [showUnlockPrompt, setShowUnlockPrompt] = useState(false);
  const { token, vaultKey, isVaultUnlocked, unlockVault } = useAuth();
  
  function handleInputChange(event) {
    const { name, value } = event.target;

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    // Validate before we try to encrypt or send anything to the backend.
    setErrors({});
    const validationErrors = validateForm(formData);

    if (validationErrors.form) {
      setErrors(validationErrors);
      return;
    }

    if (!isVaultUnlocked) {
      setShowUnlockPrompt(true);
      return;
    }

    await saveVaultItem(vaultKey);
  }

  async function handleUnlock(masterPassword) {
    // Restore the memory-only vault key, then continue the save the user started.
    const unlockedVaultKey = await unlockVault(masterPassword);
    setShowUnlockPrompt(false);
    await saveVaultItem(unlockedVaultKey);
  }

  async function saveVaultItem(currentVaultKey) {
    setIsSaving(true);

    try {
      // Encrypt the full password entry in the browser before sending it.
      // Notes stay inside this encrypted blob instead of becoming a DB column.
      const encryptedEntry = await encryptEntry(
        {
          accountLogin: formData.accountLogin.trim(),
          website: formData.website.trim(),
          password: formData.password,
          notes: formData.notes.trim(),
        },
        currentVaultKey,
      );

      // Backend stores searchable metadata plus the encrypted password blob.
      await createVaultItem(token, {
        website_name: formData.website.trim(),
        website_url: formData.website.trim(),
        username: formData.accountLogin.trim(),
        encrypted_blob: encryptedEntry.ciphertext,
        iv: encryptedEntry.iv,
      });

      navigate("/vault");
    } catch (err) {
      setErrors({ form: err.message || "Failed to save password" });
    } finally {
      setIsSaving(false);
    }
  }

  function generatePassword(length=32) {
    // Generates a 32-length password bassed off user input. Mixes user input into length - password.length long randomly generated string. 
    // If user has no input, generates a 32-length random password.
    let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*"
    const base = formData.password
    let generated = base;
    const remaining = Math.max(length - base.length, 0);
    const array = new Uint32Array(remaining)
    window.crypto.getRandomValues(array)
    for (let i = 0; i < remaining; i ++) {
      generated += chars[array[i] % chars.length]
    }
    generated = generated.split("")
    .sort(() => Math.random() - 0.5)
    .join("");

    setFormData((currentFormData) => ({
      ...currentFormData,
      password: generated,
      verifyPassword: generated
    }));
  }

  return (
    <AppShell>
      <section className="add-password-page">
        <form className="add-password-form" onSubmit={handleSubmit}>
          <label className="add-password-form__field">
            <span>Account Login:</span>
            <input
              type="text"
              name="accountLogin"
              value={formData.accountLogin}
              onChange={handleInputChange}
              placeholder="email@gmail.com"
            />
          </label>

          <label className="add-password-form__field">
            <span>Website:</span>
            <input
              type="text"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              placeholder="www.gmail.com"
            />
          </label>

          <label className="add-password-form__field">
            <span>Password:</span>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="**************"
            />
          </label>

          <label className="add-password-form__field">
            <span>Verify Password</span>
            <input
              type="password"
              name="verifyPassword"
              value={formData.verifyPassword}
              onChange={handleInputChange}
              placeholder="**************"
            />
          </label>

          <label className="add-password-form__field">
            <span>Notes:</span>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Optional notes"
            />
          </label>

          {errors.form ? (
            <p className="add-password-form__error">{errors.form}</p>
          ) : null}
          <div className="add-password-form__button-box">
          <button
            style={{fontSize:"1.4rem"}}
            className="add-password-form__button"
            type="button"
            onClick={()=>generatePassword()}>
            Generate Password
          </button>
          <button
            className="add-password-form__button"
            type="submit"
            disabled={isSaving}
            >
            {isSaving ? "Saving..." : "Save"}
          </button>
            </div>
        </form>
      </section>
      {showUnlockPrompt ? (
        <UnlockVaultModal
          onUnlock={handleUnlock}
          onCancel={() => setShowUnlockPrompt(false)}
        />
      ) : null}
    </AppShell>
  );
}

function validateForm(formData) {
  const accountLogin = formData.accountLogin.trim();
  const website = formData.website.trim();

  if (!accountLogin || !website || !formData.password || !formData.verifyPassword) {
    return { form: "Please fill out every field." };
  }

  if (formData.password !== formData.verifyPassword) {
    return { form: "Passwords do not match." };
  }

  return {};
}
