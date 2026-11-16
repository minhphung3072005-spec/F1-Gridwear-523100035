import type { ApiErrorBody } from "../types/api";

const API_URL = import.meta.env.VITE_API_URL ?? "/api/v1";
let accessToken: string | null = localStorage.getItem("f1_access_token");

export class ApiError extends Error {
  constructor(public status: number, public body: ApiErrorBody) { super(body.message); }
}

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) localStorage.setItem("f1_access_token", token);
  else localStorage.removeItem("f1_access_token");
}

export function hasAccessToken() { return Boolean(accessToken); }

async function request<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  const response = await fetch(`${API_URL}${path}`, { ...options, headers, credentials: "include" });
  if (response.status === 401 && retry && accessToken && !path.includes("/auth/refresh")) {
    const refreshed = await fetch(`${API_URL}/auth/refresh`, { method: "POST", credentials: "include" });
    if (refreshed.ok) {
      const payload = await refreshed.json();
      setAccessToken(payload.data.accessToken);
      return request<T>(path, options, false);
    }
    setAccessToken(null);
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({ success: false, message: "Không thể kết nối máy chủ", code: "NETWORK_ERROR" })) as ApiErrorBody;
    throw new ApiError(response.status, body);
  }
  if (response.status === 204) return undefined as T;
  const payload = await response.json();
  return payload.data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown, headers?: HeadersInit) => request<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body), headers }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body: body === undefined ? undefined : JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
