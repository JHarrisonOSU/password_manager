// Keeps URL cleanup in one place so Add/Edit Password store URLs consistently.

export function normalizeWebsiteUrl(value) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  // Let users type "github.com" while still storing a complete URL shape.
  const urlWithProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmedValue)
    ? trimmedValue
    : `https://${trimmedValue}`;

  try {
    const url = new URL(urlWithProtocol);
    const hostname = url.hostname.toLowerCase();

    if (!isValidHostname(hostname)) {
      return "";
    }

    url.hostname = hostname;

    // Avoid showing a lonely trailing slash for plain domains in the vault list.
    if (url.pathname === "/" && !url.search && !url.hash) {
      return `${url.protocol}//${url.hostname}`;
    }

    return url.toString();
  } catch {
    return "";
  }
}

function isValidHostname(hostname) {
  // Keep validation light to catch typos without blocking normal domains.
  return (
    hostname.includes(".") &&
    !hostname.includes(" ") &&
    /^[a-z\d.-]+$/i.test(hostname)
  );
}
