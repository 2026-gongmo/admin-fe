import { ApiError, type ApiResponse } from "./apiTypes";

export type ApiMode = "mock" | "http";

const TOKEN_KEY = "onda_admin_access_token";
const ADMIN_KEY = "onda_admin_profile";
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_ADMIN_PASSWORD || "onda1234!";

export function getApiMode(): ApiMode {
  const mode = import.meta.env.VITE_API_MODE;
  return mode === "http" || mode === "api" ? "http" : "mock";
}

export function getApiBaseUrl(): string {
  return (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:18080").replace(/\/$/, "");
}

export function isDemoAutoLoginEnabled(): boolean {
  return import.meta.env.VITE_DEMO_AUTO_LOGIN !== "false";
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(ADMIN_KEY);
}

export function getStoredAdmin<T>(): T | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(ADMIN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    window.localStorage.removeItem(ADMIN_KEY);
    return null;
  }
}

export function setStoredAdmin<T>(admin: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
}

export async function httpRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await requestOnce(path, options);
  const payload = (await parseJson(response)) as ApiResponse<T> | null;

  if (!response.ok) {
    if (response.status === 401) {
      const refreshed = await refreshDemoSession(path);
      if (refreshed) {
        return httpRequest<T>(path, options);
      }
      clearStoredToken();
    }
    throw new ApiError(
      payload?.code ?? `HTTP_${response.status}`,
      payload?.message ?? "API 요청에 실패했습니다.",
      response.status
    );
  }

  if (!payload) {
    throw new ApiError("EMPTY_RESPONSE", "API 응답이 비어 있습니다.", response.status);
  }

  if (!payload.success) {
    throw new ApiError(payload.code, payload.message, response.status);
  }

  return payload.data;
}

export async function httpDownload(path: string, options: RequestInit = {}): Promise<Blob> {
  const response = await requestOnce(path, options);

  if (!response.ok) {
    if (response.status === 401) {
      const refreshed = await refreshDemoSession(path);
      if (refreshed) {
        return httpDownload(path, options);
      }
      clearStoredToken();
    }
    const payload = (await parseJson(response).catch(() => null)) as
      | { code?: string; message?: string }
      | null;
    throw new ApiError(
      payload?.code ?? `HTTP_${response.status}`,
      payload?.message ?? "파일 다운로드에 실패했습니다.",
      response.status
    );
  }

  return response.blob();
}

async function requestOnce(path: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  const token = getStoredToken();

  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  try {
    return await fetch(`${getApiBaseUrl()}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(
      "NETWORK_ERROR",
      "백엔드 서버에 연결하지 못했습니다. Spring Boot 서버와 VITE_API_BASE_URL을 확인해 주세요.",
      0
    );
  }
}

async function refreshDemoSession(failedPath: string): Promise<boolean> {
  if (!shouldAttemptDemoReauth(failedPath)) return false;

  const previousAdmin = getStoredAdmin<{ email?: string }>();
  clearStoredToken();

  try {
    const response = await requestOnce("/api/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: previousAdmin?.email || "center@onda.test",
        password: DEMO_PASSWORD,
      }),
    });
    if (!response.ok) return false;

    const payload = (await parseJson(response)) as
      | ApiResponse<{
          accessToken: string;
          admin: unknown;
        }>
      | null;
    if (!payload?.success || !payload.data?.accessToken) return false;

    setStoredToken(payload.data.accessToken);
    setStoredAdmin(payload.data.admin);
    return true;
  } catch {
    return false;
  }
}

function shouldAttemptDemoReauth(path: string): boolean {
  if (!isDemoAutoLoginEnabled()) return false;
  return !path.startsWith("/api/admin/auth/");
}

export function toQueryString(params: Record<string, unknown>): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "" || value === "all") return;
    query.set(key, String(value));
  });
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

async function parseJson(response: Response): Promise<unknown | null> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError("INVALID_JSON", "API 응답 JSON 파싱에 실패했습니다.", response.status);
  }
}
