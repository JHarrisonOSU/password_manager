import { useState } from "react";

// Read-only credential view based on the prototype modal. Edit is still
// disabled, but Delete now calls back to VaultPage so it can remove the row.
export default function CredentialDetailsModal({
  credential,
  decryptedEntry,
  onClose,
  onDelete,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Prefer decrypted values, but fall back to backend metadata for list fields.
  const accountLogin = decryptedEntry.accountLogin || credential.username || "";
  const website =
    decryptedEntry.website || credential.website_url || credential.website_name || "";
  const password = decryptedEntry.password || "";
  const notes = decryptedEntry.notes || "";

  return (
    <div className="credential-modal__overlay">
      <section className="credential-modal" aria-modal="true" role="dialog">
        <button
          className="credential-modal__close"
          type="button"
          onClick={onClose}
          aria-label="Close credential details"
        >
          ×
        </button>

        <label className="credential-modal__field">
          <span>Account Login:</span>
          <input value={accountLogin} readOnly />
        </label>

        <label className="credential-modal__field">
          <span>Website:</span>
          <input value={website} readOnly />
        </label>

        <label className="credential-modal__field">
          <span>Password:</span>
          <div className="credential-modal__input-row">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              readOnly
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </label>

        <label className="credential-modal__field">
          <span>Notes:</span>
          <input value={notes} readOnly placeholder="No notes saved" />
        </label>

        <div className="credential-modal__actions">
          <button type="button" disabled>
            Edit
          </button>
          <button type="button" onClick={() => setIsConfirmingDelete(true)}>
            Delete
          </button>
        </div>

        {isConfirmingDelete ? (
          <div className="credential-modal__confirm">
            <p>Delete this saved password?</p>
            <div className="credential-modal__confirm-actions">
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
              >
                Cancel
              </button>
              <button type="button" onClick={() => onDelete(credential.id)}>
                Delete
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
