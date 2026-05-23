// Centralizes backend calls so pages do not hardcode URLs or fetch details.
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// Shared JSON request helper. It adds default headers, parses JSON when
// present, and turns non-2xx responses into thrown errors for page handlers.
async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.detail || "Request failed");
  }

  return data;
}

// Auth endpoints
export function getSalt(email) {
  return request(`/auth/salt?email=${encodeURIComponent(email)}`);
}

export function registerUser(payload) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function loginUser(payload) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// MFA endpoints
export function verifyMfaLogin(payload) {
  return request("/auth/mfa/verify", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function setupMfa(token) {
  return request("/auth/mfa/setup", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function verifyMfaSetup(token, code) {
  return request("/auth/mfa/verify-setup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ code }),
  });
}

// Current-user lookup for authenticated UI and debugging.
export function getCurrentUser(token) {
  return request("/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
