// Centralizes backend calls so pages do not hardcode URLs or fetch details.
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// Shared JSON request helper. It adds default headers, parses JSON when
// present, and turns non-2xx responses into thrown errors for page handlers.
async function request(path, options = {}) {
  const { headers, ...requestOptions } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestOptions,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(getErrorMessage(data));
  }

  return data;
}

function getErrorMessage(data) {
  if (!data?.detail) {
    return "Request failed";
  }

  if (typeof data.detail === "string") {
    return data.detail;
  }

  if (Array.isArray(data.detail)) {
    return data.detail
      .map((item) => item.msg || JSON.stringify(item))
      .join(" ");
  }

  return JSON.stringify(data.detail);
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

// Gets all saved vault items for the logged-in user.
export function getVaultItems(token) {
  return request("/vault", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// Creates a new encrypted vault item for the logged-in user.
export function createVaultItem(token, payload) {
  return request("/vault", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

// Updates one vault item by id.
export function updateVaultItem(token, id, payload) {
  return request(`/vault/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

// Deletes one vault item by id.
export function deleteVaultItem(token, id) {
  return request(`/vault/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
