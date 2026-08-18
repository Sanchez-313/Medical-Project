const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/+$/, "");
const TOKEN_KEY = "admin_api_token";
const USER_KEY = "admin_api_user";

const DEMO_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "admin@medical.local";
const DEMO_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "admin123";
const STARTUP_RETRY_DELAYS_MS = [500, 1000, 1500, 2000, 2500];

function parseJsonSafely(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function isRetryableNetworkError(error) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("failed to fetch") || message.includes("networkerror");
}

function sleep(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function request(path, { method = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  let lastError;

  for (let attempt = 0; attempt <= STARTUP_RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      break;
    } catch (error) {
      lastError = error;
      if (!isRetryableNetworkError(error) || attempt === STARTUP_RETRY_DELAYS_MS.length) {
        throw new Error(`API server is not reachable at ${API_BASE_URL}`);
      }
      await sleep(STARTUP_RETRY_DELAYS_MS[attempt]);
    }
  }

  if (!response) {
    throw lastError || new Error(`API server is not reachable at ${API_BASE_URL}`);
  }

  const text = await response.text();
  const json = parseJsonSafely(text);

  if (!response.ok) {
    const message = json?.message || "Request failed";
    throw new Error(message);
  }

  return json;
}

function readStoredAuth() {
  return {
    token: localStorage.getItem(TOKEN_KEY),
    user: parseJsonSafely(localStorage.getItem(USER_KEY)),
  };
}

function writeStoredAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user || null));
}

function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function ensureAdminToken() {
  const stored = readStoredAuth();
  if (stored.token) {
    return stored.token;
  }

  const loginResult = await request("/api/auth/login", {
    method: "POST",
    body: {
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    },
  });

  const token = loginResult?.data?.token;
  const user = loginResult?.data?.user;
  if (!token) {
    throw new Error("Login succeeded but no token was returned.");
  }

  writeStoredAuth(token, user);
  return token;
}

async function withAuth(path, options = {}) {
  let token = await ensureAdminToken();
  try {
    return await request(path, { ...options, token });
  } catch (error) {
    if (error?.message?.toLowerCase() === "unauthorized") {
      clearStoredAuth();
      token = await ensureAdminToken();
      return request(path, { ...options, token });
    }
    throw error;
  }
}

export async function getInventory({ search = "", category = "" } = {}) {
  const params = new URLSearchParams();
  if (search.trim()) params.set("search", search.trim());
  if (category.trim()) params.set("category", category.trim());
  const suffix = params.toString() ? `?${params}` : "";
  return withAuth(`/api/inventory${suffix}`);
}

export async function updateInventoryItem(id, payload) {
  return withAuth(`/api/inventory/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function getCustomers({ type = "", search = "" } = {}) {
  const params = new URLSearchParams();
  if (type.trim()) params.set("type", type.trim());
  if (search.trim()) params.set("search", search.trim());
  const suffix = params.toString() ? `?${params}` : "";
  return withAuth(`/api/customers${suffix}`);
}

export async function createCustomer(payload) {
  return withAuth("/api/customers", {
    method: "POST",
    body: payload,
  });
}

export async function getDeliveries() {
  return withAuth("/api/deliveries");
}

export async function getOrders() {
  return withAuth("/api/orders");
}

export async function updateDelivery(id, payload) {
  return withAuth(`/api/deliveries/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function getReviews() {
  return withAuth("/api/reviews");
}

export async function getHealth() {
  return request("/api/health");
}
