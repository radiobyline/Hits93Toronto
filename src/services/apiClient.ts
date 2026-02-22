import { API_BASE, OPTIONAL_WORKER_PROXY_URL } from "../config/constants";

type QueryValue = string | number | boolean;
export type QueryParams = Record<string, QueryValue | undefined | null>;

function normalizePath(path: string): string {
  if (!path.startsWith("/")) {
    return `/${path}`;
  }

  return path;
}

function applyParams(url: URL, params: QueryParams): void {
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    url.searchParams.set(key, String(value));
  });
}

export function buildApiUrl(path: string, params: QueryParams = {}): string {
  const normalizedPath = normalizePath(path);

  if (OPTIONAL_WORKER_PROXY_URL) {
    const proxyUrl = new URL(OPTIONAL_WORKER_PROXY_URL, window.location.origin);
    proxyUrl.searchParams.set("path", normalizedPath);
    applyParams(proxyUrl, params);
    return proxyUrl.toString();
  }

  const targetUrl = new URL(`${API_BASE}${normalizedPath}`);
  applyParams(targetUrl, params);
  return targetUrl.toString();
}

export async function fetchJson<T>(
  path: string,
  params: QueryParams = {},
  init?: RequestInit
): Promise<T> {
  const response = await fetch(buildApiUrl(path, params), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {})
    }
  });

  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${response.statusText}`);
  }

  return (await response.json()) as T;
}
