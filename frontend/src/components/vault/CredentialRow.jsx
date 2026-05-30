import { getCredentialRowMeta } from "../../lib/vaultItemUtils";

export default function CredentialRow({ credential, onSelect }) {
  const credentialMeta = getCredentialRowMeta(credential);

  return (
    <button
      className="credential-row"
      type="button"
      onClick={() => onSelect(credential)}
    >
      <div className="credential-row__info">
        <h2 className="credential-row__title">
          {/* Backend returns website_name for the display name. */}
          {credential.website_name || "Untitled website"}
        </h2>
        {credentialMeta ? (
          <p className="credential-row__meta">{credentialMeta}</p>
        ) : null}
      </div>

      {/* The whole row opens details; this label keeps the action obvious. */}
      <span className="credential-row__button" aria-hidden="true">
        Select
      </span>
    </button>
  );
}
