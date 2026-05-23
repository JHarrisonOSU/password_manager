import { useState } from "react";
import AppShell from "../components/layout/AppShell";
import UnlockVaultModal from "../components/forms/UnlockVaultModal";
import { useAuth } from "../lib/useAuth";
// TODO: Fetch this credential list from the backend once the vault API is ready.
const credentials = [
  { id: 1, website: "Google" },
  { id: 2, website: "GitHub" },
  { id: 3, website: "Netflix" },
  { id: 4, website: "Amazon" },
  { id: 5, website: "Spotify" },
];

export default function VaultPage() {
  const [showAllCredentials, setShowAllCredentials] = useState(false);
  const [showUnlockPrompt, setShowUnlockPrompt] = useState(false);
  const { isVaultUnlocked, unlockVault } = useAuth();

  const visibleCredentials = showAllCredentials
    ? credentials
    : credentials.slice(0, 3);

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

        <div className="vault-page__list">
          {visibleCredentials.map((credential) => (
            <article className="credential-row" key={credential.id}>
              <h2 className="credential-row__title">{credential.website}</h2>

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
