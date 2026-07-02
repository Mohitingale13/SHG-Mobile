import { getItem, setItem, removeItem } from "@/lib/storage";
import { Platform } from "react-native";

const SESSION_TOKEN_KEY = "shg_session_token";

const BASE_URL: string =
  Platform.OS !== "web" && process.env.EXPO_PUBLIC_API_URL
    ? process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, "")
    : "";

export async function getToken(): Promise<string | null> {
  return await getItem(SESSION_TOKEN_KEY);
}

export async function saveToken(token: string): Promise<void> {
  await setItem(SESSION_TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await removeItem(SESSION_TOKEN_KEY);
}

export async function apiFetch(
  method: string,
  path: string,
  body?: unknown,
  authenticated = true,
): Promise<Response> {
  const headers: Record<string, string> = {};
  if (body) headers["Content-Type"] = "application/json";

  if (authenticated) {
    const token = await getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  return res;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await apiFetch("GET", path);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function apiPost<T>(path: string, body: unknown, authenticated = true): Promise<T> {
  const res = await apiFetch("POST", path, body, authenticated);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await apiFetch("PATCH", path, body);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const res = await apiFetch("PUT", path, body);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function apiDelete<T = { ok: boolean }>(path: string): Promise<T> {
  const res = await apiFetch("DELETE", path);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}
