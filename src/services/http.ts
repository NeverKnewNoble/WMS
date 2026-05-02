/**
 * Tiny fetch wrapper used by every service file.
 *
 * Pattern:
 *   const items = await apiGet<ItemsListResponse>("/api/items?status=low");
 *
 * The wrapper:
 *   - sends/receives JSON
 *   - throws an `ApiError` (with status + parsed body) on non-2xx
 *   - lets services attach a domain-specific message via `try/catch`
 */

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Init = Omit<RequestInit, "body" | "method">;

async function request<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
  init?: Init,
): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: {
      ...(body !== undefined ? { "content-type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: "same-origin",
    ...init,
  });

  // 204 No Content
  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const parsed = text ? safeJson(text) : null;

  if (!res.ok) {
    const message =
      (parsed && typeof parsed === "object" && "error" in parsed
        ? String((parsed as { error: unknown }).error)
        : null) ?? `Request failed with ${res.status}`;
    throw new ApiError(res.status, message, parsed);
  }

  return parsed as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export const http = {
  get:    <T>(path: string, init?: Init)              => request<T>("GET",    path, undefined, init),
  post:   <T>(path: string, body: unknown, init?: Init) => request<T>("POST",   path, body, init),
  patch:  <T>(path: string, body: unknown, init?: Init) => request<T>("PATCH",  path, body, init),
  delete: <T>(path: string, init?: Init)              => request<T>("DELETE", path, undefined, init),
};

/**
 * Build a query string from an object, omitting nullish/empty values so the
 * server only sees filters that the caller actually set.
 *
 *   qs({ status: "low", limit: 20 })  // "?status=low&limit=20"
 *   qs({})                            // ""
 */
export function qs(params: Record<string, string | number | boolean | null | undefined>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    if (v === null || v === undefined || v === "") continue;
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  }
  return parts.length ? `?${parts.join("&")}` : "";
}

/**
 * Re-throw an unknown error as an ApiError with a domain-specific message.
 * Use it in service functions so consumers always get a typed error.
 */
export function rethrow(err: unknown, fallbackMessage: string): never {
  if (err instanceof ApiError) {
    // Preserve status/body, but optionally wrap the message for clarity.
    throw new ApiError(err.status, `${fallbackMessage}: ${err.message}`, err.body);
  }
  throw new ApiError(0, fallbackMessage, err);
}
