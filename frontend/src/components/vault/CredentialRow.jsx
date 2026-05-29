import { getCredentialRowMeta } from "../../lib/vaultItemUtils";

export default function CredentialRow({ credential, onSelect }) {
  const credentialMeta = getCredentialRowMeta(credential);

  return (
    <article className="credential-row">
      <div className="credential-row__info">
        <h2 className="credential-row__title">
          {/* Backend returns website_name for the display name. */}
          {credential.website_name || "Untitled website"}
        </h2>
        {credentialMeta ? (
          <p className="credential-row__meta">{credentialMeta}</p>
        ) : null}
      </div>

      <button
        className="credential-row__button"
        type="button"
        onClick={() => onSelect(credential)}
      >
        Select
      </button>
    </article>
  );
}
