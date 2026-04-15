import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

let authState = {
  user: null,
  loading: true,
};

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

async function parseJson(response) {
  return response.json().catch(() => null);
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.headers || {}),
    },
  });

  const payload = await parseJson(response);

  if (!response.ok || payload?.success === false) {
    throw new Error(
      payload?.message ||
        payload?.detail ||
        `Request failed with status ${response.status}`
    );
  }

  return payload;
}

export async function refreshAuth() {
  setAuthState({ loading: true });

  try {
    const payload = await request("/auth/me");
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
  });

  return response.user || null;
}

export async function logoutUser() {
  try {
    await request("/auth/logout", { method: "POST" });
  } finally {
    clearAuthUser();
  }
}
