import { useEffect, useState } from "react";
import AppShell from "../components/layout/AppShell";
import UnlockVaultModal from "../components/forms/UnlockVaultModal";
import { useAuth } from "../lib/useAuth";
import { getVaultItems } from "../services/authService";

export default function VaultPage() {
  // Track creds, whether the GET /vault request is still running, and any error.
  const [credentials, setCredentials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [showAllCredentials, setShowAllCredentials] = useState(false);
  const [showUnlockPrompt, setShowUnlockPrompt] = useState(false);
  // token is needed for the Authorization header; unlockVault restores the vault key after refresh.
  const { token, isVaultUnlocked, unlockVault } = useAuth();

  const visibleCredentials = showAllCredentials
    ? credentials
    : credentials.slice(0, 3);

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

  function handleSelectCredential() {
    if (!isVaultUnlocked) {
      setShowUnlockPrompt(true);
      return;
    }

    // TODO: Open the credential details/edit modal for this credential.
  }

  async function handleUnlock(masterPassword) {
    await unlockVault(masterPassword);
    setShowUnlockPrompt(false);
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
          // TODO: Connect this <input to local filtering or a backend search endpoint.
        />

        {/* Shows while GET /vault is still loading. */}
        {isLoading ? <p>Loading vault...</p> : null}

        {/* Shows backend or network errors from loading the vault. */}
        {errorMessage ? <p>{errorMessage}</p> : null}

        {/* Shows when the backend works but the user has no saved passwords yet. */}
        {!isLoading && !errorMessage && credentials.length === 0 ? (
          <p>No saved passwords yet.</p>
        ) : null}

        {!isLoading && !errorMessage ? (
          <div className="vault-page__list">
            {visibleCredentials.map((credential) => (
              <article className="credential-row" key={credential.id}>
                <h2 className="credential-row__title">
                  {/* Backend returns website_name, not website. */}
                  {credential.website_name}
                </h2>

                <button
                  className="credential-row__button"
                  type="button"
                  onClick={handleSelectCredential}
                >
                  Select
                </button>
              </article>
            ))}
          </div>
        ) : null}
        {credentials.length > 3 ? (
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
    </AppShell>
  );
}
