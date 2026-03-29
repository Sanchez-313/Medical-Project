const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
).replace(/\/+$/, "");

const STARTUP_RETRY_DELAYS_MS = [250, 500, 1000];

function isRetryableNetworkError(error) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("failed to fetch") || message.includes("networkerror");
}

function sleep(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function buildUrl(path) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

async function parseJson(response) {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export async function requestJson(path, options = {}) {
  let response;
  let lastError;

  for (let attempt = 0; attempt <= STARTUP_RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      response = await fetch(buildUrl(path), options);
      break;
    } catch (error) {
      lastError = error;
      if (
        !isRetryableNetworkError(error) ||
        attempt === STARTUP_RETRY_DELAYS_MS.length
      ) {
        throw error;
      }
      await sleep(STARTUP_RETRY_DELAYS_MS[attempt]);
    }
  }

  if (!response) {
    throw lastError || new Error(`API server is not reachable at ${API_BASE_URL}`);
  }

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return parseJson(response);
}

export async function authRequestJson(path, { method = "GET", body, token } = {}) {
  if (!token) {
    throw new Error("Unauthorized");
  }

  const response = await fetch(buildUrl(path), {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await parseJson(response);

  if (!response.ok) {
    const error = new Error(json?.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return json;
}

export { API_BASE_URL };
