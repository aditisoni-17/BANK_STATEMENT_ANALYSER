import { useEffect, useState } from "react";
import { navigateTo } from "./router";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

let authState = {
  user: null,
  loading: true,
};

let csrfToken = null;
const listeners = new Set();

function emitAuthState() {
  listeners.forEach((listener) => listener(authState));
}

function setAuthState(nextState) {
  authState = { ...authState, ...nextState };
  emitAuthState();
}

function subscribeAuthState(listener) {
  listeners.add(listener);
  listener(authState);
  return () => listeners.delete(listener);
}

function parseCookie(name) {
  const parts = document.cookie ? document.cookie.split("; ") : [];
  const prefix = `${name}=`;

  for (const part of parts) {
    if (part.startsWith(prefix)) {
      return decodeURIComponent(part.slice(prefix.length));
    }
  }

  return null;
}

async function parseJson(response) {
  return response.json().catch(() => null);
}

async function ensureCsrfToken(force = false) {
  if (!force && csrfToken) {
    return csrfToken;
  }

  const existingCookieToken = parseCookie("bsta_csrf");
  if (!force && existingCookieToken) {
    csrfToken = existingCookieToken;
    return csrfToken;
  }

  const response = await fetch(`${API_URL}/auth/csrf`, {
    method: "GET",
    credentials: "include",
  });

  const payload = await parseJson(response);
  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.message || `Failed to initialize CSRF token (${response.status})`);
  }

  csrfToken = payload?.csrf_token || existingCookieToken;
  return csrfToken;
}

function clearCsrfToken() {
  csrfToken = null;
}

function handleUnauthorized({ skipUnauthorizedRedirect = false, skipAuthStateClear = false } = {}) {
  if (!skipAuthStateClear) {
    clearAuthUser();
  }

  if (!skipUnauthorizedRedirect && window.location.pathname !== "/login") {
    navigateTo("/login");
  }
}

async function request(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const unsafeMethod = !["GET", "HEAD", "OPTIONS"].includes(method);
  const headers = {
    ...(options.headers || {}),
  };

  if (unsafeMethod && !options.skipCsrf) {
    const token = await ensureCsrfToken();
    if (token) {
      headers["X-CSRF-Token"] = token;
    }
  }

  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...options,
    headers,
  });

  const payload = await parseJson(response);

  if (response.status === 401) {
    handleUnauthorized(options);
  }

  if (!response.ok || payload?.success === false) {
    const error = new Error(
      payload?.message ||
        payload?.detail ||
        `Request failed with status ${response.status}`
    );
    error.status = response.status;
    throw error;
  }

  return payload;
}

export const apiRequest = request;

export async function refreshAuth() {
  setAuthState({ loading: true });

  try {
    const payload = await request("/auth/me", {
      skipUnauthorizedRedirect: true,
    });
    setAuthState({ user: payload.user || null, loading: false });
    return payload.user || null;
  } catch {
    setAuthState({ user: null, loading: false });
    return null;
  }
}

export function useAuth() {
  const [state, setState] = useState(authState);

  useEffect(() => subscribeAuthState(setState), []);

  return state;
}

export function setAuthUser(user) {
  setAuthState({ user, loading: false });
}

export function clearAuthUser() {
  setAuthState({ user: null, loading: false });
}

export async function loginUser(payload) {
  const response = await request("/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    skipUnauthorizedRedirect: true,
    skipAuthStateClear: true,
  });

  setAuthUser(response.user || null);
  return response.user || null;
}

export async function signupUser(payload) {
  const response = await request("/auth/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    skipUnauthorizedRedirect: true,
    skipAuthStateClear: true,
  });

  return response.user || null;
}

export async function logoutUser() {
  try {
    await request("/auth/logout", { method: "POST" });
  } finally {
    clearCsrfToken();
    clearAuthUser();
  }
}
