// src/services/apiClient.ts
// ─────────────────────────────────────────────────────────────
// Single source of truth for all API calls.
// Set VITE_API_URL in your .env / .env.production file.
// The X-DB-Session header is automatically injected on every
// request when a session token is stored in sessionStorage.
// ─────────────────────────────────────────────────────────────

export const BASE_URL: string =
  (import.meta as any).env?.VITE_API_URL ??
  (import.meta as any).env?.VITE_API_BASE_URL ??
  'http://localhost:8000';

const SESSION_KEY = 'db_session_token';
const AUTH_TOKEN_KEY = 'auth_token';

// ── Session token helpers ────────────────────────────────────

export function storeDbSessionToken(token: string): void {
  sessionStorage.setItem(SESSION_KEY, token);
}

export function getDbSessionToken(): string | null {
  return sessionStorage.getItem(SESSION_KEY);
}

export function clearDbSessionToken(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function storeAuthToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function clearAuthToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

// ── Core fetch wrapper ───────────────────────────────────────

export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const dbSessionToken = getDbSessionToken();
  const authToken = getAuthToken();

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  // Inject session token header if we have one
  if (dbSessionToken) {
    headers['X-DB-Session'] = dbSessionToken;
  }

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  // Only set Content-Type for requests with a body, and only if not already set
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  return fetch(`${BASE_URL}${path}`, { ...options, headers });
}

// ── Typed JSON helper ────────────────────────────────────────

export async function apiJson<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await apiFetch(path, options);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}
