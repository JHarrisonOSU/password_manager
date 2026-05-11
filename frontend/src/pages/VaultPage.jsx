import { useState } from "react";
import AppShell from "../components/layout/AppShell";

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

  const visibleCredentials = showAllCredentials
    ? credentials
    : credentials.slice(0, 3);

  return (
    <AppShell>
      <section className="vault-page">
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

              <button className="credential-row__button" type="button">
                {/* TODO: Open the credential details/edit modal for this credential. */}
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
    </AppShell>
  );
}
