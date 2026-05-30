import { useState } from "react";

// Prompts for the master password when a valid session has lost its in-memory
// vault key, such as after a full page refresh.
export default function UnlockVaultModal({ onUnlock, onCancel }) {
  const [masterPassword, setMasterPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    setIsUnlocking(true);

    try {
      await onUnlock(masterPassword);
    } catch (err) {
      setErrorMessage(err.message || "Unable to unlock vault");
    } finally {
      setIsUnlocking(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="totp-modal">
        <h3>Unlock Vault</h3>
        <p>Enter your master password to decrypt vault data.</p>

        <form
          className="totp-modal__form totp-modal__form--full"
          onSubmit={handleSubmit}
        >
          <input
            className="totp-field"
            type="password"
            value={masterPassword}
            onChange={(event) => setMasterPassword(event.target.value)}
            autoFocus
          />

          {errorMessage ? (
            <p className="totp-modal__message totp-modal__message--error">
              {errorMessage}
            </p>
          ) : null}

          <button
            className="auth-page__button totp-modal__button"
            type="submit"
            disabled={!masterPassword || isUnlocking}
          >
            {isUnlocking ? "Unlocking..." : "Unlock"}
          </button>

          <button
            className="auth-page__button totp-modal__button totp-modal__button--secondary"
            type="button"
            onClick={onCancel}
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}
