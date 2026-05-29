import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import UnlockVaultModal from "../components/forms/UnlockVaultModal";
import { useAuth } from "../lib/useAuth";
import { generatePasswordSuggestion } from "../lib/passwordUtils";
import {
  buildVaultCreatePayload,
  validateVaultItemForm,
} from "../lib/vaultItemUtils";
import { createVaultItem } from "../services/authService";

const initialFormData = {
  accountLogin: "",
  websiteName: "",
  websiteUrl: "",
  password: "",
  verifyPassword: "",
  notes: "",
};

export default function AddPasswordPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  // One toggle controls both password fields so the user can compare them.
  const [showPassword, setShowPassword] = useState(false);
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
    const validationErrors = validateVaultItemForm(formData);

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
      const payload = await buildVaultCreatePayload(formData, currentVaultKey);
      await createVaultItem(token, payload);

      navigate("/vault");
    } catch (err) {
      setErrors({ form: err.message || "Failed to save password" });
    } finally {
      setIsSaving(false);
    }
  }

  function generatePassword(length = 32) {
    const generated = generatePasswordSuggestion(formData.password, length);

    setFormData((currentFormData) => ({
      ...currentFormData,
      password: generated,
      verifyPassword: generated,
    }));
  }

  return (
    <AppShell>
      <section className="add-password-page">
        <header className="add-password-page__header">
          <h1>Add Password</h1>
          <p>Save a new credential to your encrypted vault.</p>
        </header>

        <div className="add-password-page-layout">
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
              <span>Website Name:</span>
              <input
                type="text"
                name="websiteName"
                value={formData.websiteName}
                onChange={handleInputChange}
                placeholder="Gmail"
              />
            </label>

            <label className="add-password-form__field add-password-form__field--wide">
              <span>Website URL:</span>
              <input
                type="text"
                name="websiteUrl"
                value={formData.websiteUrl}
                onChange={handleInputChange}
                placeholder="gmail.com"
              />
            </label>

            <label className="add-password-form__field">
              <span>Password:</span>
              <div className="add-password-form__input-row">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="**************"
                />
                <button
                  className="add-password-form__icon-button"
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                </button>
              </div>
            </label>

            <label className="add-password-form__field">
              <span>Verify Password</span>
              <input
                type={showPassword ? "text" : "password"}
                name="verifyPassword"
                value={formData.verifyPassword}
                onChange={handleInputChange}
                placeholder="**************"
              />
            </label>

            <label className="add-password-form__field add-password-form__field--wide">
              <span>Notes:</span>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Optional notes"
              />
            </label>

            {errors.form ? (
              <p className="add-password-form__error add-password-form__field--wide">
                {errors.form}
              </p>
            ) : null}
            <div className="add-password-form__button-box">
              <button
                className="add-password-form__button add-password-form__button--secondary"
                type="button"
                onClick={() => generatePassword()}
              >
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

        {/* Keep tips near the form so users see them while creating a new entry. */}
        <aside className="password-tips" aria-label="Password tips">
          <h2>Password Tips</h2>
          <ul>
            <li>Use a unique password for every account.</li>
            <li>Use the generator when you do not need a memorable password.</li>
            <li>Save the real website URL so search and lookup stay clear.</li>
            <li>Never reuse your master password for another account.</li>
          </ul>
        </aside>
        </div>
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
