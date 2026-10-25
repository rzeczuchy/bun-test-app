import { getToken } from "./session.js";

// Local dev: API runs on port 3001 of the same host. Change this for production.
const API_URL = `${location.protocol}//${location.hostname}:3001`;

async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  if (auth) headers.Authorization = `Bearer ${getToken()}`;

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body && JSON.stringify(body),
    });
  } catch {
    throw new Error("Cannot reach the server. Check that the backend is running.");
  }

  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    throw Object.assign(new Error(data?.error ?? "Something went wrong"), { status: res.status });
  }
  return data;
}

export const login = (username, password) =>
  request("/api/auth/login", { method: "POST", body: { username, password } });

export const getMe = () => request("/api/auth/me", { auth: true });

export const logout = () => request("/api/auth/logout", { method: "POST", auth: true });
