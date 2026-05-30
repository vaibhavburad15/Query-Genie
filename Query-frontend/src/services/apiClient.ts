// src/services/apiClient.ts
// ─────────────────────────────────────────────────────────────
// Single source of truth for all API calls.
// Set VITE_API_URL in your .env / .env.production file.
// The X-DB-Session header is automatically injected on every
// request when a session token is stored in sessionStorage.
// Auth tokens are now handled via HttpOnly cookies (secure against XSS)
// ─────────────────────────────────────────────────────────────

export const BASE_URL: string =
  (import.meta as any).env?.VITE_API_URL ??
  (import.meta as any).env?.VITE_API_BASE_URL ??
  'http://localhost:8000';

const SESSION_KEY = 'db_session_token';

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

// ── Core fetch wrapper ───────────────────────────────────────

export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const dbSessionToken = getDbSessionToken();

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  // Inject session token header if we have one
  if (dbSessionToken) {
    headers['X-DB-Session'] = dbSessionToken;
  }

  // Auth token is now in HttpOnly cookie - sent automatically by browser
  // No need to manually add Authorization header

  // Only set Content-Type for requests with a body, and only if not already set
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  return fetch(`${BASE_URL}${path}`, { 
    ...options, 
    headers,
    credentials: 'include'  // Important: send cookies with requests
  });
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
