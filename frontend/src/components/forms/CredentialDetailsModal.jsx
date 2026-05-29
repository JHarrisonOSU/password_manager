import { useState } from "react";

// Credential detail modal based on the prototype. It starts in read-only mode,
// then switches into a small edit form when the user chooses Edit.
export default function CredentialDetailsModal({
  credential,
  decryptedEntry,
  onClose,
  onDelete,
  onSave,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // The form state is separate from decryptedEntry so typing does not mutate
  // the saved value until Save finishes successfully.
  const [formData, setFormData] = useState(() =>
    getCredentialFormData(credential, decryptedEntry),
  );

  function handleFieldChange(event) {
    const { name, value } = event.target;

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));
  }

  function handleCancelEdit() {
    // Throw away unsaved edits and return to the last decrypted saved values.
    setFormData(getCredentialFormData(credential, decryptedEntry));
    setIsEditing(false);
    setErrorMessage("");
  }

  async function handleSave() {
    const cleanedFormData = {
      accountLogin: formData.accountLogin.trim(),
      website: formData.website.trim(),
      password: formData.password,
      notes: formData.notes.trim(),
    };

    if (
      !cleanedFormData.accountLogin ||
      !cleanedFormData.website ||
      !cleanedFormData.password
    ) {
      setErrorMessage("Account login, website, and password are required.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      // VaultPage owns the actual API call because it has the token and vault key.
      const savedFormData = await onSave(credential.id, cleanedFormData);
      setFormData(savedFormData);
      setIsEditing(false);
    } catch (err) {
      setErrorMessage(err.message || "Failed to save credential");
    } finally {
      setIsSaving(false);
    }
  }

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
          <input
            name="accountLogin"
            value={formData.accountLogin}
            onChange={handleFieldChange}
            readOnly={!isEditing}
          />
        </label>

        <label className="credential-modal__field">
          <span>Website:</span>
          <input
            name="website"
            value={formData.website}
            onChange={handleFieldChange}
            readOnly={!isEditing}
          />
        </label>

        <label className="credential-modal__field">
          <span>Password:</span>
          <div className="credential-modal__input-row">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleFieldChange}
              readOnly={!isEditing}
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
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleFieldChange}
            readOnly={!isEditing}
            placeholder="No notes saved"
          />
        </label>

        {errorMessage ? (
          <p className="credential-modal__error">{errorMessage}</p>
        ) : null}

        <div className="credential-modal__actions">
          {isEditing ? (
            <>
              <button
                className="credential-modal__save-button"
                type="button"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
              <button
                className="credential-modal__cancel-button"
                type="button"
                onClick={handleCancelEdit}
                disabled={isSaving}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                className="credential-modal__edit-button"
                type="button"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </button>
              <button
                className="credential-modal__delete-button"
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
              >
                Delete
              </button>
            </>
          )}
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

function getCredentialFormData(credential, decryptedEntry) {
  // Prefer decrypted values, but fall back to backend metadata for list fields.
  return {
    accountLogin: decryptedEntry.accountLogin || credential.username || "",
    website:
      decryptedEntry.website ||
      credential.website_url ||
      credential.website_name ||
      "",
    password: decryptedEntry.password || "",
    notes: decryptedEntry.notes || "",
  };
}
