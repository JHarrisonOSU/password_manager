import { encryptEntry } from "../crypto/VaultCrypto";
import { normalizeWebsiteUrl } from "./websiteUtils";

export function credentialMatchesSearch(credential, normalizedSearchQuery) {
  // Search only website fields so usernames do not unexpectedly match.
  const searchableText = [credential.website_name, credential.website_url]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchableText.includes(normalizedSearchQuery);
}

export function getCredentialRowMeta(credential) {
  // Show useful non-secret metadata on the row without exposing passwords.
  return [credential.username, credential.website_url]
    .filter(Boolean)
    .join(" - ");
}

export function sortCredentialsByWebsiteName(credentials) {
  // Sort a copy so React state is not mutated while rendering.
  return [...credentials].sort((firstCredential, secondCredential) =>
    getWebsiteName(firstCredential).localeCompare(
      getWebsiteName(secondCredential),
      undefined,
      { sensitivity: "base" },
    ),
  );
}

export function validateVaultItemForm(formData) {
  const accountLogin = formData.accountLogin.trim();
  const websiteName = formData.websiteName.trim();
  const websiteUrl = formData.websiteUrl.trim();
  const normalizedWebsiteUrl = normalizeWebsiteUrl(websiteUrl);

  if (
    !accountLogin ||
    !websiteName ||
    !websiteUrl ||
    !formData.password ||
    !formData.verifyPassword
  ) {
    return { form: "Please fill out every field." };
  }

  if (!normalizedWebsiteUrl) {
    return { form: "Enter a valid website, like discord.com." };
  }

  if (formData.password !== formData.verifyPassword) {
    return { form: "Passwords do not match." };
  }

  return {};
}

function getWebsiteName(credential) {
  return credential.website_name || "";
}

export async function buildVaultCreatePayload(formData, vaultKey) {
  const normalizedWebsiteUrl = normalizeWebsiteUrl(formData.websiteUrl);

  if (!normalizedWebsiteUrl) {
    throw new Error("Enter a valid website, like discord.com.");
  }

  // Only password details go into the encrypted blob; metadata stays searchable.
  const encryptedEntry = await encryptEntry(
    {
      password: formData.password,
      notes: formData.notes.trim(),
    },
    vaultKey,
  );

  return {
    website_name: formData.websiteName.trim(),
    website_url: normalizedWebsiteUrl,
    username: formData.accountLogin.trim(),
    encrypted_blob: encryptedEntry.ciphertext,
    iv: encryptedEntry.iv,
  };
}

export async function buildVaultUpdatePayload(updatedDetails, vaultKey) {
  const normalizedWebsiteUrl = normalizeWebsiteUrl(updatedDetails.websiteUrl);

  if (!normalizedWebsiteUrl) {
    throw new Error("Enter a valid website, like discord.com.");
  }

  const encryptedDetails = {
    password: updatedDetails.password,
    notes: updatedDetails.notes,
  };
  const encryptedEntry = await encryptEntry(encryptedDetails, vaultKey);

  return {
    payload: {
      website_name: updatedDetails.websiteName,
      website_url: normalizedWebsiteUrl,
      username: updatedDetails.accountLogin,
      encrypted_blob: encryptedEntry.ciphertext,
      iv: encryptedEntry.iv,
    },
    savedFormData: {
      ...encryptedDetails,
      accountLogin: updatedDetails.accountLogin,
      websiteName: updatedDetails.websiteName,
      websiteUrl: normalizedWebsiteUrl,
    },
  };
}
