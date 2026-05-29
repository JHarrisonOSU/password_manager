import { useEffect, useState } from "react";
import AppShell from "../components/layout/AppShell";
import CredentialDetailsModal from "../components/forms/CredentialDetailsModal";
import UnlockVaultModal from "../components/forms/UnlockVaultModal";
import { decryptEntry, encryptEntry } from "../crypto/VaultCrypto";
import { useAuth } from "../lib/useAuth";
import {
  deleteVaultItem,
  getVaultItems,
  updateVaultItem,
} from "../services/authService";
import { normalizeWebsiteUrl } from "../lib/websiteUtils";

export default function VaultPage() {
  // Track creds, whether the GET /vault request is still running, and any error.
  const [credentials, setCredentials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllCredentials, setShowAllCredentials] = useState(false);
  const [showUnlockPrompt, setShowUnlockPrompt] = useState(false);
  const [pendingCredential, setPendingCredential] = useState(null);
  const [selectedCredential, setSelectedCredential] = useState(null);
  const [selectedCredentialDetails, setSelectedCredentialDetails] =
    useState(null);
  const [credentialError, setCredentialError] = useState("");
  const [statusMessage, setStatusMessage] = useState(null);
  // token is needed for the Authorization header; unlockVault restores the vault key after refresh.
  const { token, vaultKey, isVaultUnlocked, unlockVault } = useAuth();

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredCredentials = normalizedSearchQuery
    ? credentials.filter((credential) =>
        credentialMatchesSearch(credential, normalizedSearchQuery),
      )
    : credentials;
  const visibleCredentials = showAllCredentials
    ? filteredCredentials
    : filteredCredentials.slice(0, 3);

  useEffect(() => {
    async function loadVaultItems() {
      // Reset page state before starting the request.
      setIsLoading(true);
      setErrorMessage("");

      try {
        // Ask the backend for the current user's vault rows.
        const items = await getVaultItems(token);
        setCredentials(items);
      } catch (err) {
        // Keep the error visible instead of failing silently.
        setErrorMessage(err.message || "Failed to load vault items");
      } finally {
        // Stop showing the loading state whether the request worked or failed.
        setIsLoading(false);
      }
    }

    // Only fetch once auth has provided a token.
    if (token) {
      loadVaultItems();
    }
  }, [token]);

  async function handleSelectCredential(credential) {
    setCredentialError("");
    setStatusMessage(null);

    if (!isVaultUnlocked) {
      // Remember the row so we can open it right after the vault is unlocked.
      setPendingCredential(credential);
      setShowUnlockPrompt(true);
      return;
    }

    await openCredentialDetails(credential, vaultKey);
  }

  async function handleUnlock(masterPassword) {
    const unlockedVaultKey = await unlockVault(masterPassword);
    setShowUnlockPrompt(false);

    if (pendingCredential) {
      await openCredentialDetails(pendingCredential, unlockedVaultKey);
      setPendingCredential(null);
    }
  }

  async function handleDeleteCredential(credentialId) {
    setCredentialError("");
    setStatusMessage(null);

    try {
      await deleteVaultItem(token, credentialId);

      // Remove it from the current list without needing a full refetch.
      setCredentials((currentCredentials) =>
        currentCredentials.filter(
          (credential) => credential.id !== credentialId,
        ),
      );

      setSelectedCredential(null);
      setSelectedCredentialDetails(null);
      setStatusMessage({
        type: "success",
        text: "Password deleted.",
      });
    } catch (err) {
      const message = err.message || "Failed to delete credential";
      setCredentialError(message);
      throw new Error(message);
    }
  }

  async function handleSaveCredential(credentialId, updatedDetails) {
    setCredentialError("");
    setStatusMessage(null);

    if (!vaultKey) {
      throw new Error("Unlock your vault before editing this password.");
    }

    // Only password details are re-encrypted; name/url/login stay as metadata.
    const normalizedWebsiteUrl = normalizeWebsiteUrl(updatedDetails.websiteUrl);

    if (!normalizedWebsiteUrl) {
      throw new Error("Enter a valid website, like discord.com.");
    }

    const encryptedDetails = {
      password: updatedDetails.password,
      notes: updatedDetails.notes,
    };
    const savedFormData = {
      ...encryptedDetails,
      accountLogin: updatedDetails.accountLogin,
      websiteName: updatedDetails.websiteName,
      websiteUrl: normalizedWebsiteUrl,
    };
    const encryptedEntry = await encryptEntry(encryptedDetails, vaultKey);
    const updatedCredential = await updateVaultItem(token, credentialId, {
      website_name: updatedDetails.websiteName,
      website_url: normalizedWebsiteUrl,
      username: updatedDetails.accountLogin,
      encrypted_blob: encryptedEntry.ciphertext,
      iv: encryptedEntry.iv,
    });

    // Keep the page in sync immediately instead of forcing a full vault refetch.
    setCredentials((currentCredentials) =>
      currentCredentials.map((credential) =>
        credential.id === credentialId ? updatedCredential : credential,
      ),
    );

    setSelectedCredential(updatedCredential);
    setSelectedCredentialDetails(savedFormData);
    setStatusMessage({
      type: "success",
      text: "Password updated.",
    });

    return savedFormData;
  }

  async function openCredentialDetails(credential, currentVaultKey) {
    try {
      // Decrypt only the selected row when the user asks to view it.
      const decryptedEntry = await decryptEntry(
        {
          iv: credential.iv,
          ciphertext: credential.encrypted_blob,
        },
        currentVaultKey,
      );

      setSelectedCredential(credential);
      setSelectedCredentialDetails(decryptedEntry);
    } catch (err) {
      setCredentialError(err.message || "Failed to decrypt credential");
    }
  }

  return (
    <AppShell>
      <section className="vault-page">
        {!isVaultUnlocked ? (
          <p className="vault-page__locked">
            Vault locked. Select a credential to unlock it.
          </p>
        ) : null}

        <input
          className="vault-page__search"
          type="search"
          placeholder="Search passwords"
          aria-label="Search passwords"
          value={searchQuery}
          onChange={(event) => {
            // Search stays local because the backend already returned the safe metadata.
            setSearchQuery(event.target.value);
            setShowAllCredentials(false);
          }}
        />

        {/* Shows while GET /vault is still loading. */}
        {isLoading ? <p>Loading vault...</p> : null}

        {/* Shows backend or network errors from loading the vault. */}
        {errorMessage ? <p>{errorMessage}</p> : null}
        {credentialError ? <p>{credentialError}</p> : null}
        {statusMessage ? (
          <p
            className={`vault-page__status vault-page__status--${statusMessage.type}`}
          >
            {statusMessage.text}
          </p>
        ) : null}

        {/* Shows when the backend works but the user has no saved passwords yet. */}
        {!isLoading && !errorMessage && credentials.length === 0 ? (
          <p>No saved passwords yet.</p>
        ) : null}

        {/* Shows when the vault has items, but none match the current search. */}
        {!isLoading &&
        !errorMessage &&
        credentials.length > 0 &&
        filteredCredentials.length === 0 ? (
          <p>No passwords match your search.</p>
        ) : null}

        {!isLoading && !errorMessage ? (
          <div className="vault-page__list">
            {visibleCredentials.map((credential) => {
              const credentialMeta = getCredentialRowMeta(credential);

              return (
                <article className="credential-row" key={credential.id}>
                  <div className="credential-row__info">
                    <h2 className="credential-row__title">
                      {/* Backend returns website_name, not website. */}
                      {credential.website_name || "Untitled website"}
                    </h2>
                    {credentialMeta ? (
                      <p className="credential-row__meta">{credentialMeta}</p>
                    ) : null}
                  </div>

                  <button
                    className="credential-row__button"
                    type="button"
                    onClick={() => handleSelectCredential(credential)}
                  >
                    Select
                  </button>
                </article>
              );
            })}
          </div>
        ) : null}
        {filteredCredentials.length > 3 ? (
          <button
            className="vault-page__show-more"
            type="button"
            onClick={() => setShowAllCredentials((current) => !current)}
          >
            {showAllCredentials ? "Show Less" : "Show More"}
          </button>
        ) : null}
      </section>
      {showUnlockPrompt ? (
        <UnlockVaultModal
          onUnlock={handleUnlock}
          onCancel={() => setShowUnlockPrompt(false)}
        />
      ) : null}
      {selectedCredential && selectedCredentialDetails ? (
        <CredentialDetailsModal
          credential={selectedCredential}
          decryptedEntry={selectedCredentialDetails}
          onDelete={handleDeleteCredential}
          onSave={handleSaveCredential}
          onClose={() => {
            setSelectedCredential(null);
            setSelectedCredentialDetails(null);
          }}
        />
      ) : null}
    </AppShell>
  );
}

function credentialMatchesSearch(credential, normalizedSearchQuery) {
  // Only search backend metadata so we do not need to decrypt every password row.
  const searchableText = [
    credential.website_name,
    credential.website_url,
    credential.username,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchableText.includes(normalizedSearchQuery);
}

function getCredentialRowMeta(credential) {
  // Show the most useful safe metadata on the row without exposing passwords.
  return [credential.username, credential.website_url]
    .filter(Boolean)
    .join(" - ");
}
