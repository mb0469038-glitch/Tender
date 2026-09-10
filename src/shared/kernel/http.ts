/**
 * Lightweight HTTP client for web API communications.
 * Uses credentials: "include" for session cookie persistence.
 */

export const isTauri = (): boolean => {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
};

const BASE_URL = import.meta.env.VITE_API_URL || "";

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const data = await response.json();
      if (data && data.error) {
        errorMessage = data.error;
      }
    } catch {
      // Body not JSON
    }
    throw new Error(errorMessage);
  }

  // Handle 204 No Content or empty bodies
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as unknown as T;
  }

  return JSON.parse(text) as T;
}

export const http = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: "GET" }),
  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
  put: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: "PUT", body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: "DELETE" }),
};
