import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import AppShell from "../components/layout/AppShell";
import CredentialDetailsModal from "../components/forms/CredentialDetailsModal";
import CredentialRow from "../components/vault/CredentialRow";
import UnlockVaultModal from "../components/forms/UnlockVaultModal";
import { decryptEntry } from "../crypto/VaultCrypto";
import { useAuth } from "../lib/useAuth";
import {
  buildVaultUpdatePayload,
  credentialMatchesSearch,
  sortCredentialsByWebsiteName,
} from "../lib/vaultItemUtils";
import {
  deleteVaultItem,
  getVaultItems,
  updateVaultItem,
} from "../services/authService";

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
  const sortedCredentials = sortCredentialsByWebsiteName(filteredCredentials);
  const visibleCredentials = showAllCredentials
    ? sortedCredentials
    : sortedCredentials.slice(0, 3);
  const visibleCount = visibleCredentials.length;
  const matchingCount = sortedCredentials.length;

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

    const { payload, savedFormData } = await buildVaultUpdatePayload(
      updatedDetails,
      vaultKey,
    );
    const updatedCredential = await updateVaultItem(token, credentialId, payload);

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
        <header className="vault-page__header">
          <h1>All Passwords</h1>
          <p>Search and manage your saved credentials.</p>
        </header>

        <div className="vault-page-layout">
          <div className="vault-page__main">
            {!isVaultUnlocked ? (
              <p className="vault-page__locked">
                Vault locked. Select a credential to unlock it.
              </p>
            ) : null}

            <label className="vault-page__search-shell">
              <Search aria-hidden="true" size={22} />
              <input
                className="vault-page__search"
                type="search"
                placeholder="Search website name or URL"
                aria-label="Search passwords"
                value={searchQuery}
                onChange={(event) => {
                  // Search stays local because the backend already returned the safe metadata.
                  setSearchQuery(event.target.value);
                  setShowAllCredentials(false);
                }}
              />
            </label>

            {/* Shows while GET /vault is still loading. */}
            {isLoading ? (
              <p className="vault-page__notice">Loading vault...</p>
            ) : null}

            {/* Shows backend or network errors from loading the vault. */}
            {errorMessage ? (
              <p className="vault-page__notice vault-page__notice--error">
                {errorMessage}
              </p>
            ) : null}
            {credentialError ? (
              <p className="vault-page__notice vault-page__notice--error">
                {credentialError}
              </p>
            ) : null}
            {statusMessage ? (
              <p
                className={`vault-page__notice vault-page__notice--${statusMessage.type}`}
              >
                {statusMessage.text}
              </p>
            ) : null}

            {/* Shows when the backend works but the user has no saved passwords yet. */}
            {!isLoading && !errorMessage && credentials.length === 0 ? (
              <p className="vault-page__notice">
                No saved passwords yet. Add your first password to start your
                vault.
              </p>
            ) : null}

            {/* Shows when the vault has items, but none match the current search. */}
            {!isLoading &&
            !errorMessage &&
            credentials.length > 0 &&
            sortedCredentials.length === 0 ? (
              <p className="vault-page__notice">
                No passwords match your search.
              </p>
            ) : null}

            {!isLoading && !errorMessage ? (
              <div className="vault-page__list">
                {visibleCredentials.map((credential) => (
                  <CredentialRow
                    credential={credential}
                    key={credential.id}
                    onSelect={handleSelectCredential}
                  />
                ))}
              </div>
            ) : null}
            {sortedCredentials.length > 3 ? (
              <button
                className="vault-page__show-more"
                type="button"
                onClick={() => setShowAllCredentials((current) => !current)}
              >
                {showAllCredentials ? "Show Less" : "Show More"}
              </button>
            ) : null}
          </div>

          <aside className="vault-summary" aria-label="Vault summary">
            <h2>Vault Summary</h2>
            <dl className="vault-summary__stats">
              <div>
                <dt>Total Saved</dt>
                <dd>{credentials.length}</dd>
              </div>
              <div>
                <dt>Matching Search</dt>
                <dd>{matchingCount}</dd>
              </div>
              <div>
                <dt>Showing</dt>
                <dd>{visibleCount}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{isVaultUnlocked ? "Unlocked" : "Locked"}</dd>
              </div>
            </dl>
            <p>
              Password details are decrypted only after you select an entry. If
              the vault is locked, you’ll be asked for your master password
              first.
            </p>
          </aside>
        </div>
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
