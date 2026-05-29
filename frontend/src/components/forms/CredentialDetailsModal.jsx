import { Copy, Eye, EyeOff } from "lucide-react";
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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
    setSuccessMessage("");
  }

  function handleCancelEdit() {
    // Throw away unsaved edits and return to the last decrypted saved values.
    setFormData(getCredentialFormData(credential, decryptedEntry));
    setIsEditing(false);
    setErrorMessage("");
    setSuccessMessage("");
  }

  async function handleSave() {
    const cleanedFormData = {
      accountLogin: formData.accountLogin.trim(),
      websiteName: formData.websiteName.trim(),
      websiteUrl: formData.websiteUrl.trim(),
      password: formData.password,
      notes: formData.notes.trim(),
    };

    if (
      !cleanedFormData.accountLogin ||
      !cleanedFormData.websiteName ||
      !cleanedFormData.websiteUrl ||
      !cleanedFormData.password
    ) {
      setErrorMessage(
        "Account login, website name, website URL, and password are required.",
      );
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      // VaultPage owns the actual API call because it has the token and vault key.
      const savedFormData = await onSave(credential.id, cleanedFormData);
      setFormData(savedFormData);
      setIsEditing(false);
      setSuccessMessage("Credential updated.");
    } catch (err) {
      setErrorMessage(err.message || "Failed to save credential");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // VaultPage removes the row and closes this modal after the API succeeds.
      await onDelete(credential.id);
    } catch (err) {
      setErrorMessage(err.message || "Failed to delete credential");
      setIsDeleting(false);
    }
  }

  async function handleCopyPassword() {
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // Clipboard access must happen from a button click, so keep it here.
      await navigator.clipboard.writeText(formData.password);
      setSuccessMessage("Password copied.");
    } catch {
      setErrorMessage("Could not copy password.");
    }
  }

  const actionInProgress = isSaving || isDeleting;

  return (
    <div className="credential-modal__overlay">
      <section className="credential-modal" aria-modal="true" role="dialog">
        <button
          className="credential-modal__close"
          type="button"
          onClick={onClose}
          disabled={actionInProgress}
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
          <span>Website Name:</span>
          <input
            name="websiteName"
            value={formData.websiteName}
            onChange={handleFieldChange}
            readOnly={!isEditing}
          />
        </label>

        <label className="credential-modal__field">
          <span>Website URL:</span>
          <input
            name="websiteUrl"
            value={formData.websiteUrl}
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
              className="credential-modal__icon-button"
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
            </button>
            <button
              className="credential-modal__icon-button"
              type="button"
              onClick={handleCopyPassword}
              disabled={!formData.password}
              aria-label="Copy password"
              title="Copy password"
            >
              <Copy size={22} />
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
        {successMessage ? (
          <p className="credential-modal__success">{successMessage}</p>
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
                onClick={() => {
                  // Clear delete confirmation before switching into edit mode.
                  setIsConfirmingDelete(false);
                  setSuccessMessage("");
                  setIsEditing(true);
                }}
              >
                Edit
              </button>
              <button
                className="credential-modal__delete-button"
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                disabled={isDeleting}
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
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button type="button" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function getCredentialFormData(credential, decryptedEntry) {
  // Backend metadata owns these display fields; the blob only stores secrets.
  return {
    accountLogin: credential.username || "",
    websiteName: credential.website_name || "",
    websiteUrl: credential.website_url || "",
    password: decryptedEntry.password || "",
    notes: decryptedEntry.notes || "",
  };
}
