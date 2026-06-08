// src/services/apiClient.ts
// Single source of truth for all API calls.
// Set VITE_API_URL in the frontend .env / .env.production file to override.
// Auth is stored in an HttpOnly cookie, so localhost/127.0.0.1 must stay aligned.

const configuredBaseUrl =
  (import.meta as any).env?.VITE_API_URL ??
  (import.meta as any).env?.VITE_API_BASE_URL;

function getDefaultBaseUrl(): string {
  if (typeof window === 'undefined') {
    return 'http://127.0.0.1:8000';
  }

  if (window.location.protocol === 'file:') {
    return 'http://127.0.0.1:8000';
  }

  const hostname = window.location.hostname || '127.0.0.1';
  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  return `${protocol}//${hostname}:8000`;
}

export const BASE_URL: string = configuredBaseUrl?.trim() || getDefaultBaseUrl();

const SESSION_KEY = 'db_session_token';
export const AUTH_FAILURE_EVENT = 'query-genie:auth-failure';

export function storeDbSessionToken(token: string): void {
  sessionStorage.setItem(SESSION_KEY, token);
}

export function getDbSessionToken(): string | null {
  return sessionStorage.getItem(SESSION_KEY);
}

export function clearDbSessionToken(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

function clearStoredAuthState(): void {
  localStorage.removeItem('user');
  localStorage.removeItem('isAuthenticated');
  clearDbSessionToken();
}

function shouldHandleAuthFailure(path: string): boolean {
  return !['/api/login', '/api/signup', '/api/send-otp'].some((publicPath) =>
    path.startsWith(publicPath)
  );
}

export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const dbSessionToken = getDbSessionToken();

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  if (dbSessionToken) {
    headers['X-DB-Session'] = dbSessionToken;
  }

  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 401 && shouldHandleAuthFailure(path)) {
    clearStoredAuthState();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(AUTH_FAILURE_EVENT));
    }
  }

  return response;
}

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
